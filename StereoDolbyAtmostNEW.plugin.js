/**
 * @name StereoDolbyAtmostNEW
 * @version 0.0.4
 * @description Plugin yang membuat suara sound voice kamu lebih bagus daripada orang lain :b
 * @authorLink https://www.mafapianist.my.id
 * @website https://www.mafapianist.my.id
 * @source https://www.mafapianist.my.id
 * @invite Tm2spNRs
 * @updateUrl https://raw.githubusercontent.com/mafapianist/StereoDolbyAtmostNEW/main/StereoDolbyAtmostNEW.plugin.js
 */
module.exports = (() => {
  const config = {
    main: "index.js",
    info: {
      name: "StereoDolbyAtmostNEW",
      authors: [{ name: "Remake By Faris", discord_id: "656134149291376640" }],
      version: "0.0.4",
      description:
        "Plugin yang membuat suara sound voice kamu lebih bagus daripada orang lain :b",
    },
    changelog: [
      {
        title: "Changelog",
        items: ["Banyak penambahan channel agar bisa di samakan dengan channel - channel speaker"]
      }
    ],
    defaultConfig: [
      {
        type: "dropdown",
        id: "stereoChannelOption",
        name: "Channel Option",
        note: "Pilih Channel Yang Kamu Mau",
        value: "7.2",
        options: [
          { label: "1.0", value: "1.0" },
          { label: "2.0", value: "2.0" },
          { label: "2.1", value: "2.1" },
          { label: "4.0", value: "4.0" },
          { label: "4.1", value: "4.1" },
          { label: "5.1", value: "5.1" },
          { label: "6.1", value: "6.1" },
          { label: "7.1", value: "7.1" },
          { label: "7.2", value: "7.2" },
          { label: "8.1", value: "8.1" },
        ],
      },
      {
        type: "dropdown",
        id: "bitrateOption",
        name: "Bitrate Option",
        note: "Pilih Bitrate Yang Kamu Mau",
        value: "5120000",
        options: [
            { label: "8kbps", value: "8000" },
            { label: "48kbps", value: "48000" },
            { label: "128kbps", value: "128000" },
            { label: "384kbps", value: "3840000" },
            { label: "512kbps", value: "5120000" },
        ],
      },
    ],
  };
  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          BdApi.showConfirmationModal(
            "Plugin Tidak Ada atau Hilang!",
            `ZeresPluginLibrary tidak ada. Klik "Instal Sekarang" untuk mengunduhnya.`,
            {
              confirmText: "Instal Sekarang",
              cancelText: "Batal",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error) {
                      console.error("Kesalahan saat mengunduh ZeresPluginLibrary:", error);
                      BdApi.showConfirmationModal(
                        "Download Error",
                        "Terjadi kesalahan saat mengunduh ZeresPluginLibrary. Silakan coba lagi nanti atau unduh secara manual dari situs web resmi.",
                        {
                          confirmText: "OK",
                          cancelText: "Cancel",
                        }
                      );
                      return;
                    }
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(
                          BdApi.Plugins.folder,
                          "0PluginLibrary.plugin.js"
                        ),
                        body,
                        r
                      )
                    );
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
          const { WebpackModules, Patcher, Toasts } = Library;
          return class stereoDolbyAtmostNEW extends Plugin {
            onStart() {
              this.settingsWarning();
              this.justJoined = false;
              const voiceModule = WebpackModules.getModule( BdApi.Webpack.Filters.byPrototypeFields("updateVideoQuality") );
              BdApi.Patcher.after("stereoDolbyAtmostNEW", voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
                  if (thisObj) {
                    const setTransportOptions = thisObj.conn.setTransportOptions;
                    const channelOption = this.settings.stereoChannelOption;
                    const selectedBitrate = this.settings.bitrateOption; 

                    thisObj.conn.setTransportOptions = function (obj) {
                      if (obj.audioEncoder) {
                        obj.audioEncoder.params = {
                          stereo: channelOption,
                        };
                        obj.audioEncoder.channels = parseFloat(channelOption);
                        obj.encodingVoiceBitRate = parseInt(selectedBitrate);
                      }
                      if (obj.fec) {
                        obj.fec = false;
                      }
                      if (obj.encodingVoiceBitRate < selectedBitrate) {
                          obj.encodingVoiceBitRate = selectedBitrate;
                      }
                      setTransportOptions.call(thisObj.conn, obj);
                    };
                    return ret;
                  }
                }
              );
              const voiceConnectionModule = WebpackModules.getByProps("hasVideo", "disconnect", "isConnected");
              this.disconnectPatcher = BdApi.Patcher.after("stereoDolbyAtmostNEW", voiceConnectionModule, "disconnect", () => {
                this.justJoined = false;
              });
            }
            settingsWarning() {
              const voiceSettingsStore = WebpackModules.getByProps(
                "getEchoCancellation"
              );
              if (
                voiceSettingsStore.getNoiseSuppression() ||
                voiceSettingsStore.getNoiseCancellation() ||
                voiceSettingsStore.getEchoCancellation()
              ) {
                if (this.settings.enableToasts) {
                  Toasts.show(
                    "Nonaktifkan Echo Cancellation, Noise Reduction, dan Noise Suppression untuk StereoDolbyAtmostNEW",
                    { type: "Peringatan", timeout: 5000 }
                  );
                }
                return true;
              } else return false;
            }
            onStop() {
              Patcher.unpatchAll();
              if (this.disconnectPatcher) this.disconnectPatcher();
            }
            getSettingsPanel() {
              const panel = this.buildSettingsPanel();
              const noteElement = document.createElement("div");
              noteElement.className = "StereoDolbyAtmostNEW";
              noteElement.textContent = "Catatan: Setelah mengubah pengaturan apa pun, silakan bergabung kembali ke saluran suara agar perubahan diterapkan.";
              noteElement.style.color = "#FFFFFF";
              noteElement.style.marginTop = "10px";
              panel.append(noteElement);
              return panel.getElement();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();
