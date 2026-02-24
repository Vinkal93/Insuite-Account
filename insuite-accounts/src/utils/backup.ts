/**
 * InSuite Accounts — Encrypted Backup Utility
 * Uses AES-256-GCM via Web Crypto API.
 * Files are saved as .insuite and can only be read by InSuite Accounts.
 */

// App-level encryption key derivation
const APP_SECRET = 'InSuite-Accounts-2026-Secure-Backup-Key';
const SALT = new TextEncoder().encode('insuite-salt-v1');
const MAGIC = 'INSUITE_BACKUP_V1';

async function deriveKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(APP_SECRET),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: SALT, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(data: string): Promise<ArrayBuffer> {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    // Format: MAGIC(17) + IV(12) + encrypted data
    const magicBytes = new TextEncoder().encode(MAGIC);
    const result = new Uint8Array(magicBytes.length + iv.length + encrypted.byteLength);
    result.set(magicBytes, 0);
    result.set(iv, magicBytes.length);
    result.set(new Uint8Array(encrypted), magicBytes.length + iv.length);
    return result.buffer;
}

export async function decryptData(buffer: ArrayBuffer): Promise<string> {
    const data = new Uint8Array(buffer);
    const magicBytes = new TextEncoder().encode(MAGIC);

    // Validate magic header
    const header = new TextDecoder().decode(data.slice(0, magicBytes.length));
    if (header !== MAGIC) {
        throw new Error('Invalid file: This is not an InSuite Accounts backup file.');
    }

    const iv = data.slice(magicBytes.length, magicBytes.length + 12);
    const encrypted = data.slice(magicBytes.length + 12);

    const key = await deriveKey();
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );
        return new TextDecoder().decode(decrypted);
    } catch {
        throw new Error('Failed to decrypt: The file may be corrupted or from a different version.');
    }
}

export function downloadFile(data: ArrayBuffer, filename: string) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}
