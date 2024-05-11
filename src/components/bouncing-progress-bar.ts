import { ProgressBarComponent } from "obsidian";

export class BouncingProgressBarComponent extends ProgressBarComponent {
    private timerId: number;

    constructor(contentEl: HTMLElement) {
        super(contentEl);
        this.timerId = -1;
        this.setDisabled(true);
        this.setValue(0);
    }

    private update() {
        const cur = this.getValue();
        this.setValue(cur + (cur == 100 ? 1 : -1 ));
    };

    start() {
        this.setDisabled(false);
        this.timerId = window.setInterval(this.update, 10);
    };

    stop() {
        if (this.timerId > 0) window.clearInterval(this.timerId);
    }
}

