"use client";

import dynamic from "next/dynamic";
import React, { useRef } from 'react';
import { Card } from "@/components/ui/card";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle  } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { DocumentMetadata } from "@/lib/types";
import { DocumentHistory } from "@/components/document-history";
import { ThemeToggle } from "@/components/theme-toggle";
import { DataSourceCard } from "@/components/data-source";

const PdfViewer = dynamic(() => import("@/components/pdf-viewer"), { ssr: false });

type DataSourcesType = {
  pageContent: string[];
  metadata: {
    pageNumber?: number;
    [key: string]: any; 
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [currentDocument, setCurrentDocument] = useState<DocumentMetadata>();

  const [fileUrl, SetfileUrl] = useState<string>("");
  const [dataSources, setDataSources] = useState<DataSourcesType[]>([]);
  const [isFullScreenModalOpen, setFullScreenModalOpen] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setError("");
      setUploadProgress(true);
      const formData = new FormData();
      formData.append("file", acceptedFiles[0]);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      setSummary(data.summary);

      const newDoc: DocumentMetadata = {
        id: data.documentId,
        filename: acceptedFiles[0].name,
        uploadedAt: new Date(),
        summary: data.summary,
        pageCount: data.pageCount,
        fileSize: acceptedFiles[0].size,
      };
      const url = URL.createObjectURL(acceptedFiles[0]);
      SetfileUrl(url)
      setDocuments((prev) => [...prev, newDoc]);
      setCurrentDocument(newDoc);
      setDataSources([])
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setUploadProgress(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleMessage = async (message: string, documentId: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/question", {
        method: "POST",
        body: JSON.stringify({
          question: message,
          documentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send question");
      }

      const data = await response.json();
      // const dataSearch = data.search.toString().trim().replace(/\.$/,'').replace(/\s+/g, ' ')
      const dataSearch = data.sources

      setDataSources(dataSearch)
      triggerSearch(dataSearch[0].pageContent)
      return data.answer;
      
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    const doc = documents.find((doc) => doc.id === documentId);
    if (doc) {
      setCurrentDocument(doc);
    }
  };


  const pdfViewerRef = useRef<any>();

  // const triggerSearch = (text: string) => {
  //     pdfViewerRef.current.search({
  //         keyword: text,
  //         matchCase: false,
  //         wholeWords: false,
  //     });
  // };

  const triggerSearch = (searchArray: string[]) => {
    pdfViewerRef.current.search(searchArray);
};


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Document Assistant</h1>
        <div>
          <ThemeToggle />
        </div>
      </div>
      {/* Fullscreen Modal for PDF and Data Sources */}
      <Dialog open={isFullScreenModalOpen} onOpenChange={setFullScreenModalOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="mb-4">
            View PDF & Data Sources Fullscreen
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 max-w-full w-full h-[100vh]">
        <VisuallyHidden>
          <DialogTitle>Accessible Hidden Title</DialogTitle>
        </VisuallyHidden>
          <div className="grid grid-cols-2 gap-6 h-full">
            <div className="border p-4">
              <PdfViewer ref={pdfViewerRef} fileUrl={fileUrl} />
            </div>
            <div className="border p-4 overflow-y-auto">
              <DataSourceCard sources={dataSources} triggerSearch={triggerSearch} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="p-6 mb-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <input {...getInputProps()} />
              {uploadProgress ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin size-4" />
                  <p>Processing document...</p>
                </div>
              ) : (
                <p>Drag and drop PDF files here, or click to select files</p>
              )}
            </div>
          </Card>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {summary && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Document Summary</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {summary}
              </p>
            </Card>
          )}

          <ChatInterface
            onSendMessage={handleMessage}
            loading={loading}
            currentDocument={currentDocument}
          />
        </div>
        

        <div className="md:sticky md:top-4">
          <DocumentHistory
            documents={documents}
            onSelect={handleDocumentSelect}
            currentId={currentDocument?.id}
          />

          <DataSourceCard sources={dataSources} triggerSearch={triggerSearch} />

          <div className="mt-8">
            <PdfViewer ref={pdfViewerRef} fileUrl={fileUrl} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
