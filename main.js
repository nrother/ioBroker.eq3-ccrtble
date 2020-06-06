"use strict";

/*
 * Created with @iobroker/create-adapter v1.24.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
const ccrtble = require("ccrtble");

class Eq3Ccrtble extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "eq3-ccrtble",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("objectChange", this.onObjectChange.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("poll interval: " + this.config.poll_interval);
        
        if (this.config.poll_interval > 0) {
            //TODO: Setup poll timer
        }
        
        this.log.info("discovering CC-RT-BLE devices...");
        const devices = await ccrtble.discover();
        for (let dev of devices) {
            this.log.info("Found device " + dev.address);
            //create objects for this device
            await this.setObjectAsync(dev.address, {
                type: "device",
                common: {
                    name: dev.address
                },
                native: {},
            });
            await this.setObjectAsync(dev.address + "." + "rssi", {
                type: "state",
                common: {
                    name: "rssi",
                    type: "number",
                    unit: "dB",
                    read: true,
                    write: false,
                    role: "value",
                },
                native: {},
            });
            await this.setObjectAsync(dev.address + "." + "temp", {
                type: "state",
                common: {
                    name: "temp",
                    type: "number",
                    unit: "°C",
                    min: 4.5,
                    max: 30,
                    step: 0.5,
                    read: true,
                    write: true,
                    role: "level.temperature",
                },
                native: {},
            });
            //write RSSI value
            //TODO: Factor out in method?
            await this.setStateAsync(dev.address + ".rssi", { val: dev._peripheral.rssi, ack: true });
        }
        
        return;

        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
        await this.setObjectAsync("testVariable", {
            type: "state",
            common: {
                name: "testVariable",
                type: "boolean",
                role: "indicator",
                read: true,
                write: true,
            },
            native: {},
        });

        // in this template all states changes inside the adapters namespace are subscribed
        this.subscribeStates("*");

        /*
        setState examples
        you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        await this.setStateAsync("testVariable", true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        await this.setStateAsync("testVariable", { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.log.info("cleaned everything up...");
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //  if (typeof obj === "object" && obj.message) {
    //      if (obj.command === "send") {
    //          // e.g. send email or pushover or whatever
    //          this.log.info("send command");

    //          // Send response in callback if required
    //          if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    //      }
    //  }
    // }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Eq3Ccrtble(options);
} else {
    // otherwise start the instance directly
    new Eq3Ccrtble();
}