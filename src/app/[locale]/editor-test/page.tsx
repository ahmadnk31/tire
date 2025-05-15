'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FullRichTextEditor } from '@/components/ui/full-rich-text-adapter';
import { RichTextEditorAdapter } from '@/components/ui/react-quill-adapter';
import { LocalizedEditor } from '@/components/ui/localized-editor';
import { Separator } from '@/components/ui/separator';

export default function EditorTestPage() {
  const [standardContent, setStandardContent] = useState('<p>Test content for standard editor</p>');
  const [fullContent, setFullContent] = useState('<p>Test content for full rich text editor</p>');
  const [localizedSimple, setLocalizedSimple] = useState({ en: '<p>Simple localized content</p>' });
  const [localizedFull, setLocalizedFull] = useState({ en: '<p>Full rich text localized content</p>' });

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Rich Text Editor Test Page</h1>
      <p className="text-gray-500 mb-8">
        This page tests different rich text editor implementations to verify they work correctly and don't lose focus.
      </p>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Standard Rich Text Editor</CardTitle>
            <CardDescription>Using RichTextEditorAdapter component</CardDescription>
          </CardHeader>
          <CardContent>
            <RichTextEditorAdapter 
              value={standardContent}
              onChange={setStandardContent}
              placeholder="Type some text here..."
              height="200px"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full Rich Text Editor</CardTitle>
            <CardDescription>Using FullRichTextEditor component</CardDescription>
          </CardHeader>
          <CardContent>
            <FullRichTextEditor 
              value={fullContent}
              onChange={setFullContent}
              placeholder="Type some text here..."
              height="200px"
            />
          </CardContent>
        </Card>

        <Separator className="my-4" />

        <Card>
          <CardHeader>
            <CardTitle>Localized Editor with Standard Rich Text</CardTitle>
            <CardDescription>Using LocalizedEditor with useRichText=true, fullRichText=false</CardDescription>
          </CardHeader>
          <CardContent>
            <LocalizedEditor 
              value={localizedSimple}
              onChange={setLocalizedSimple}
              useRichText={true}
              fullRichText={false}
              placeholder="Type some text here..."
              height="200px"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localized Editor with Full Rich Text</CardTitle>
            <CardDescription>Using LocalizedEditor with useRichText=true, fullRichText=true</CardDescription>
          </CardHeader>
          <CardContent>
            <LocalizedEditor 
              value={localizedFull}
              onChange={setLocalizedFull}
              useRichText={true}
              fullRichText={true}
              placeholder="Type some text here..."
              height="200px"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
