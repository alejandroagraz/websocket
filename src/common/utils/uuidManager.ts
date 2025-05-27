// src/uuidManager.ts

import { v4 as uuidv4 } from 'uuid';


export class UUIDManager {
    private static instance: UUIDManager;
    private readonly uuid: string;

    private constructor() {
        this.uuid = uuidv4(); // Genera un nuevo UUID
    }

    public static getInstance(): UUIDManager {
        if (!UUIDManager.instance) {
            UUIDManager.instance = new UUIDManager();
        }
        return UUIDManager.instance;
    }

    public getUUID(): string {
        return this.uuid;
    }
}
