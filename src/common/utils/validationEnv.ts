// src/common/utils/validationEnv.ts

import dotenv from 'dotenv';

dotenv.config();

export const validateEnv = (requiredEnvVars: string[]) => {
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            throw new Error(`La variable de entorno ${varName} no está definida`);
        }
    }
};
