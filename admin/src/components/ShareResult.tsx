import { useState } from 'react';

export function ShareResult({ token, exampleUrl }: { token: string; exampleUrl?: string }) {
    const [copied, setCopied] = useState(false);

    async function copy(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { }
    }

    const displayUrl = exampleUrl ?? `/#${token}`;

    return (
        <div className="rounded-md border p-3">
            <div className="text-sm text-gray-700">Share URL</div>
            <div className="mt-1 font-mono text-sm break-all">{displayUrl}</div>
            <div className="mt-2 flex items-center gap-2">
                <button
                    className="rounded-md bg-gray-100 hover:bg-gray-200 px-3 py-1 text-sm"
                    onClick={() => copy(displayUrl)}
                >
                    {copied ? 'Copied' : 'Copy URL'}
                </button>
            </div>
        </div>
    );
}


