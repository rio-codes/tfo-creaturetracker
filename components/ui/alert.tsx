'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { alertService, Alert as AlertTypeFromService, AlertType } from '@/services/alert.service';

interface AlertProps {
    id?: string;
    fade?: boolean;
}

interface AlertWithState extends AlertTypeFromService {
    itemId?: number;
    fade?: boolean;
    keepAfterRouteChange?: boolean;
}

export function Alert({ id = 'default-alert', fade = true }: AlertProps) {
    const mounted = useRef(false);
    const pathname = usePathname();
    const [alerts, setAlerts] = useState<AlertWithState[]>([]);

    function removeAlert(alertToRemove: AlertWithState) {
        if (!mounted.current) return;

        if (fade) {
            // fade out alert
            setAlerts((currentAlerts) =>
                currentAlerts.map((x) =>
                    x.itemId === alertToRemove.itemId ? { ...x, fade: true } : x
                )
            );

            // remove alert after the fade-out animation completes
            setTimeout(() => {
                setAlerts((currentAlerts) =>
                    currentAlerts.filter((x) => x.itemId !== alertToRemove.itemId)
                );
            }, 250);
        } else {
            // remove alert immediately
            setAlerts((currentAlerts) =>
                currentAlerts.filter((x) => x.itemId !== alertToRemove.itemId)
            );
        }
    }

    useEffect(() => {
        mounted.current = true;

        // subscribe to new alert notifications from the service
        const subscription = alertService.onAlert(id).subscribe((alert: AlertWithState) => {
            // clear alerts when an empty alert is received
            if (!alert.message) {
                setAlerts((currentAlerts) => {
                    const filteredAlerts = currentAlerts.filter((x) => x.keepAfterRouteChange);
                    // remove 'keepAfterRouteChange' flag from the rest
                    return filteredAlerts.map(({ keepAfterRouteChange, ...rest }) => rest);
                });
            } else {
                // add a unique ID for the React key and removal logic
                alert.itemId = Math.random();
                setAlerts((currentAlerts) => [...currentAlerts, alert]);

                // auto close alert if required
                if (alert.autoClose) {
                    setTimeout(() => removeAlert(alert), 3000);
                }
            }
        });

        // clean up function that runs when the component unmounts
        return () => {
            mounted.current = false;
            subscription.unsubscribe();
        };
    }, [id, removeAlert]); // rerun effect if the id property changes

    // separate effect to handle clearing alerts on route change
    useEffect(() => {
        // clear alerts on location change
        alertService.clear(id);
    }, [pathname, id]); // rerun whenever the path changes

    function cssClasses(alertItem: AlertWithState): string {
        const baseClasses = 'relative p-4 rounded-lg shadow-md'; // Base styles for all alerts

        const alertTypeClasses = {
            [AlertType.Success]: 'bg-green-200 text-green-800',
            [AlertType.Error]: 'bg-red-200 text-red-800',
            [AlertType.Info]: 'bg-blue-200 text-blue-800',
            [AlertType.Warning]: 'bg-yellow-200 text-yellow-800',
        };

        // Add a fade-out transition class if the alert is fading
        const fadeClass = alertItem.fade
            ? 'opacity-0 transition-opacity duration-200'
            : 'opacity-100';

        return `${baseClasses} ${alertTypeClasses[alertItem.type]} ${fadeClass}`;
    }

    if (!alerts.length) return null;
    return (
        <div className="fixed top-5 right-5 z-50 w-full max-w-sm space-y-2">
            {alerts.map((alertItem) => (
                <div key={alertItem.itemId} className={cssClasses(alertItem)}>
                    <div className="flex items-start">
                        <div
                            className="flex-1"
                            dangerouslySetInnerHTML={{ __html: alertItem.message }}
                        ></div>
                        <button
                            className="ml-4 -mt-1 -mr-1 p-1 rounded-full hover:bg-black/10"
                            onClick={() => removeAlert(alertItem)}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
