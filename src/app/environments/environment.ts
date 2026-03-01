import { Capacitor } from '@capacitor/core';

export const environment = {
    production: false,
    apiUrl: Capacitor.isNativePlatform() 
        ? 'https://awoh8q99o9.execute-api.eu-west-3.amazonaws.com' 
        : 'http://192.168.1.134:8080'
};