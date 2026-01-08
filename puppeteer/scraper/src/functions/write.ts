import fs from 'fs';
import {Post} from '../interfaces/Post';

function sanitizeString(str: string | undefined): string | undefined {
    if (!str) return str;
    // Remove control characters except newlines and tabs, then normalize whitespace
    return str
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \n, \r, \t
        .replace(/\s+/g, ' ') // Normalize whitespace to single spaces
        .trim();
}

function sanitizePost(post: Post): Post {
    const sanitized: Post = {};
    for (const [key, value] of Object.entries(post)) {
        if (typeof value === 'string') {
            sanitized[key as keyof Post] = sanitizeString(value) as any;
        } else {
            sanitized[key as keyof Post] = value;
        }
    }
    return sanitized;
}

function write(post: Post, firstPost: boolean, writeStream: fs.WriteStream): boolean {
    if (!firstPost) {
        writeStream.write(',\n');
    }

    const sanitizedPost = sanitizePost(post);
    writeStream.write('  ' + JSON.stringify(sanitizedPost, null, 2));
    return false;
}

export {write}