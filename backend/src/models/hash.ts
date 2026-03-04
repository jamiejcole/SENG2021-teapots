import crypto from 'crypto';

export function sha256(data: string) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}