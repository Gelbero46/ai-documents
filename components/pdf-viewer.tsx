import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
    MinimalButton,
    Position,
    Tooltip,
    Viewer,
    Worker,
} from '@react-pdf-viewer/core';
import { FlagKeyword, NextIcon, PreviousIcon, searchPlugin } from '@react-pdf-viewer/search';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

interface HighlightKeywordsExampleProps {
    fileUrl: string;
}

const PdfViewer = forwardRef(({ fileUrl }: HighlightKeywordsExampleProps, ref) => {
    const [currentKeyword, setCurrentKeyword] = useState<string>('');
    const [segments, setSegments] = useState<FlagKeyword[]>([]);
    const searchPluginInstance = searchPlugin();
    const { highlight, jumpToNextMatch, jumpToPreviousMatch } = searchPluginInstance;

    // Utility to split long strings into smaller segments
    const splitString = (text: string, maxLength: number) => {
        const words = text.split(' ');
        const chunks = [];
        let currentChunk = '';

        words.forEach((word) => {
            if ((currentChunk + word).length > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = word + ' ';
            } else {
                currentChunk += word + ' ';
            }
        });

        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks.map((chunk) => ({
            keyword: chunk,
            matchCase: false,
            wholeWords: false,
        }));
    };

    // Expose the search function to the parent component
    useImperativeHandle(ref, () => ({
        search: (text: string) => {
            const splitKeywords = splitString(text, 40); // Max 30 characters per segment
            setSegments(splitKeywords);
            console.log("splitKeywords", splitKeywords)
            highlight(splitKeywords)
            // splitKeywords.forEach((keyword) => highlight(keyword));
        },
    }));

    if (!fileUrl) {
        return (
            <div className="text-gray-500 text-center p-4 border border-gray-300 rounded">
                No document selected. Please upload a PDF to view.
            </div>
        );
    }

    return (
        <div className="rpv-core__viewer flex flex-col border border-gray-300 h-[600px] w-auto overflow-hidden rounded">
            {/* Search Controls */}
            <div className="flex items-center bg-gray-100 border-b border-gray-300 p-2">
                <div className="flex items-center border border-gray-300 rounded px-2">
                    <input
                        className="border-none outline-none p-1 w-60"
                        placeholder="Enter keyword to search"
                        type="text"
                        value={currentKeyword}
                        onChange={(e) => setCurrentKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && currentKeyword.trim()) {
                                const splitKeywords = splitString(currentKeyword, 50);
                                setSegments(splitKeywords);
                                console.log("splitKeywords", splitKeywords)
                                splitKeywords.forEach((keyword) => highlight(keyword));
                            }
                        }}
                    />
                </div>
                <Tooltip
                    position={Position.BottomCenter}
                    target={
                        <MinimalButton
                            onClick={jumpToPreviousMatch}
                            // className="ml-2"
                        >
                            <PreviousIcon />
                        </MinimalButton>
                    }
                    content={() => 'Previous match'}
                    offset={{ left: 0, top: 8 }}
                />
                <Tooltip
                    position={Position.BottomCenter}
                    target={
                        <MinimalButton
                            onClick={jumpToNextMatch}
                            // className="ml-2"
                        >
                            <NextIcon />
                        </MinimalButton>
                    }
                    content={() => 'Next match'}
                    offset={{ left: 0, top: 8 }}
                />
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.10.111/build/pdf.worker.min.js">
                    <Viewer fileUrl={fileUrl} plugins={[searchPluginInstance]} />
                </Worker>
            </div>
        </div>
    );
});

export default PdfViewer;
