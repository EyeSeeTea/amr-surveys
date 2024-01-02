import { noop } from "@vitest/utils";

export class Worker {
    url: string | URL;
    onmessage: any;
    onmessageerror: any;
    onerror: any;
    addEventListener: any;
    terminate: any;
    removeEventListener: any;
    dispatchEvent: any;

    constructor(scriptURL: string | URL) {
        this.url = scriptURL;
        this.onmessage = noop;
        this.onmessageerror = noop;
        this.onerror = noop;
    }
    postMessage(msg: string): void {
        this.onmessage(msg);
    }
}

Object.defineProperty(window, "Worker", {
    writable: true,
    value: Worker,
});
