import { Subject, Observable } from "rxjs";
import { filter } from "rxjs/operators";

export enum AlertType {
    Success = "Success",
    Error = "Error",
    Info = "Info",
    Warning = "Warning",
}

export interface Alert {
    id?: string;
    type: AlertType;
    message: string;
    autoClose?: boolean;
    keepAfterRouteChange?: boolean;
}

export interface AlertOptions {
    id?: string;
    autoClose?: boolean;
    keepAfterRouteChange?: boolean;
}

const alertSubject = new Subject<Alert>();
const defaultId = "default-alert";

function onAlert(id: string = defaultId): Observable<Alert> {
    return alertSubject.asObservable().pipe(filter((x) => x && x.id === id));
}

function success(message: string, options?: AlertOptions) {
    alert({ ...options, type: AlertType.Success, message });
}

function error(message: string, options?: AlertOptions) {
    alert({ ...options, type: AlertType.Error, message });
}

function info(message: string, options?: AlertOptions) {
    alert({ ...options, type: AlertType.Info, message });
}

function warn(message: string, options?: AlertOptions) {
    alert({ ...options, type: AlertType.Warning, message });
}

function alert(alertObject: Alert) {
    alertObject.id = alertObject.id || defaultId;
    alertObject.autoClose =
        alertObject.autoClose === undefined ? true : alertObject.autoClose;
    alertSubject.next(alertObject);
}

function clear(id: string = defaultId) {
    alertSubject.next({ id, type: AlertType.Success, message: "" });
}

export const alertService = {
    onAlert,
    success,
    error,
    info,
    warn,
    alert,
    clear,
};
