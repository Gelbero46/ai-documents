import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Icon, MinimalButton, Position, Tooltip, Viewer, Worker } from '@react-pdf-viewer/core';
import { FlagKeyword, NextIcon, PreviousIcon, searchPlugin } from '@react-pdf-viewer/search';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

interface HighlightKeywordsExampleProps {
    fileUrl: string;
}

const PdfViewer = forwardRef(({ fileUrl }: HighlightKeywordsExampleProps, ref) => {
    const [currentKeyword, setCurrentKeyword] = useState<FlagKeyword>({
        keyword: '',
        matchCase: false,
        wholeWords: false,
    });
    const searchPluginInstance = searchPlugin();
    const { highlight, jumpToNextMatch, jumpToPreviousMatch } = searchPluginInstance;

    // Expose the search function to the parent component
    useImperativeHandle(ref, () => ({
        search: (keyword: FlagKeyword) => {
            // setCurrentKeyword(keyword);
            highlight(keyword);
        },
    }));

    if (!fileUrl) {
      return ""
    }
    return (
        <div className="rpv-core__viewer flex flex-col border border-gray-300 h-[600px] w-auto overflow-scroll">
            <div
                className="flex items-center bg-gray-200 border-b border-gray-300 p-1"
            >
              <div className="border border-gray-300 flex px-1">
                  <input
                      className="border-none p-1 w-52"
                      placeholder="Enter to search"
                      type="text"
                      value={currentKeyword.keyword}
                      onChange={(e) => {
                          setCurrentKeyword({
                              keyword: e.target.value,
                              matchCase: currentKeyword.matchCase,
                              wholeWords: currentKeyword.wholeWords,
                          });
                      }}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentKeyword.keyword) {
                              highlight(currentKeyword);
                          }
                      }}
                  />
              </div>
              <div className="px-1">
                  <Tooltip
                      position={Position.BottomCenter}
                      target={
                          <MinimalButton onClick={jumpToPreviousMatch}>
                              <PreviousIcon />
                          </MinimalButton>
                      }
                      content={() => 'Previous match'}
                      offset={{ left: 0, top: 8 }}
                  />
              </div>
              <div className="px-1">
                  <Tooltip
                      position={Position.BottomCenter}
                      target={
                          <MinimalButton onClick={jumpToNextMatch}>
                              <NextIcon />
                          </MinimalButton>
                      }
                      content={() => 'Next match'}
                      offset={{ left: 0, top: 8 }}
                  />
              </div>
            </div>
            <div
               className='flex-1 overflow-hidden'
            >
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.10.111/build/pdf.worker.min.js">
                    <Viewer fileUrl={fileUrl} plugins={[searchPluginInstance]} />
                </Worker>
            </div>
        </div>
    );
});

export default PdfViewer;
