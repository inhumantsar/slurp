import { TextComponent } from "obsidian";

type TValidator = (input: string) => string | null;
type TOnValidate = (input: string, err: string[]) => void;

export class ValidatedTextComponent extends TextComponent {
    private readonly _validators = new Set<TValidator>();
    private readonly _errList: HTMLUListElement;
    private _onValidateCb: TOnValidate;
    private _earlyReturn: boolean;
    private _minLen: number;


    constructor(containerEl: HTMLElement) {
        super(containerEl);
        this._errList = containerEl.createEl("ul");
        this._errList.addClasses(["validation-error"]);
        this._earlyReturn = true;
        this._minLen = 3;
        this._onValidateCb = () => { };
        this.onChange(() => this.validate());
        containerEl.appendChild(this._errList);
    }

    setValidationErrorClass(className: string) {
        this._errList.addClass(className);
        return this;
    }

    setStopOnFirstError(val: boolean = true) {
        this._earlyReturn = val;
        return this;
    }

    setMinimumLength(val: number = 3) {
        this._minLen = val;
        return this;
    }

    addValidator(fn: TValidator) {
        this._validators.add(fn);
        return this;
    }

    onValidate(fn: TOnValidate) {
        this._onValidateCb = fn;
        return this;
    }

    validate() {
        const input = this.getValue() || "";
        const errs: string[] = [];

        if (input.length >= this._minLen) {
            for (const fn of this._validators) {
                const err = fn(input);
                if (err !== null)
                    errs.push(err);
                if (errs.length > 0 && this._earlyReturn)
                    break;
            }
        }

        this._errList.replaceChildren(...errs);
        this._onValidateCb(input, errs);
    }
}