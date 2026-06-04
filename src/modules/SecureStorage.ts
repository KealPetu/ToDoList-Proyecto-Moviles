// src/modules/SecureStorage.ts
import { NativeModules } from 'react-native';

const { SecureStorageModule } = NativeModules;

export type StorageMechanism = 'SHARED_PREFS' | 'ENCRYPTED_PREFS' | 'DATASTORE';

export const SecureStorage = {
    saveSecret: async (key: string, value: string, mechanism: StorageMechanism): Promise<string> => {
        return await SecureStorageModule.saveSecret(key, value, mechanism);
    },

    getSecret: async (key: string, mechanism: StorageMechanism): Promise<string | null> => {
        return await SecureStorageModule.getSecret(key, mechanism);
    }
};