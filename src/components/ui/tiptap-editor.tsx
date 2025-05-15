'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import React, { useState, forwardRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Type,
  ListOrdered,
  List,
  Heading1,
  Heading2,
  Quote,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Toggle } from './toggle';
import { Input } from './input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Separator } from './separator';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export const TipTapEditor = forwardRef<HTMLDivElement, TipTapEditorProps>(
  function TipTapEditor({ value, onChange, placeholder, editable = true, className }, ref) {
    const [linkUrl, setLinkUrl] = useState<string>('');
    const [linkMenuOpen, setLinkMenuOpen] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [imageMenuOpen, setImageMenuOpen] = useState<boolean>(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Image,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-500 underline',
          },
        }),
        Underline,
        TextStyle,
        Color,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Placeholder.configure({
          placeholder: placeholder || 'Write your content here...',
        }),
        Subscript,
        Superscript,
        Typography,
      ],
      content: value,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editable,
    });

    const addImage = () => {
      if (imageUrl && editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: imageUrl })
          .run();
        setImageUrl('');
        setImageMenuOpen(false);
      }
    };

    const setLink = () => {
      if (linkUrl && editor) {
        editor
          .chain()
          .focus()
          .toggleLink({ href: linkUrl })
          .run();
        setLinkUrl('');
        setLinkMenuOpen(false);
      }
    };

    if (!editor) {
      return null;
    }

    return (
      <div className={cn('tiptap-editor-wrapper', className)} ref={ref}>
        <div className="tiptap-toolbar bg-muted/50 border rounded-t-md p-1 flex flex-wrap gap-1 items-center">
          {/* Text formatting */}
          <div className="flex items-center">
            <Toggle
              size="sm"
              pressed={editor.isActive('bold')}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
              aria-label="Bold"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('italic')}
              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italic"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('underline')}
              onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
              aria-label="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center">
            <Toggle
              size="sm"
              pressed={editor.isActive('heading', { level: 1 })}
              onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              aria-label="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('heading', { level: 2 })}
              onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              aria-label="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('paragraph')}
              onPressedChange={() => editor.chain().focus().setParagraph().run()}
              aria-label="Normal text"
            >
              <Type className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center">
            <Toggle
              size="sm"
              pressed={editor.isActive('bulletList')}
              onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
              aria-label="Bullet list"
            >
              <List className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('orderedList')}
              onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
              aria-label="Ordered list"
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('blockquote')}
              onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
              aria-label="Quote"
            >
              <Quote className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center">
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'left' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'center' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'right' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive({ textAlign: 'justify' })}
              onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
              aria-label="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and media */}
          <div className="flex items-center">
            <Popover open={linkMenuOpen} onOpenChange={setLinkMenuOpen}>
              <PopoverTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('link')}
                  aria-label="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Toggle>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Link URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                    <Button size="sm" onClick={setLink}>Add</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {editor.isActive('link') && (
              <Toggle
                size="sm"
                onPressedChange={() => editor.chain().focus().unsetLink().run()}
                aria-label="Unlink"
              >
                <Unlink className="h-4 w-4" />
              </Toggle>
            )}
            <Popover open={imageMenuOpen} onOpenChange={setImageMenuOpen}>
              <PopoverTrigger asChild>
                <Toggle size="sm" aria-label="Image">
                  <ImageIcon className="h-4 w-4" />
                </Toggle>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <Button size="sm" onClick={addImage}>Add</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Subscript and Superscript */}
          <div className="flex items-center">
            <Toggle
              size="sm"
              pressed={editor.isActive('subscript')}
              onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
              aria-label="Subscript"
            >
              <SubscriptIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('superscript')}
              onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
              aria-label="Superscript"
            >
              <SuperscriptIcon className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Undo/Redo */}
          <div className="flex items-center ms-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              Undo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              Redo
            </Button>
          </div>
        </div>

        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background border shadow-md rounded-md p-1 flex gap-1"
          >
            <Toggle
              size="sm"
              pressed={editor.isActive('bold')}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('italic')}
              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('underline')}
              onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>
          </BubbleMenu>
        )}

        <div className="px-3 py-2 bg-background border-x border-b rounded-b-md min-h-[250px]">
          <EditorContent editor={editor} className="prose dark:prose-invert max-w-none min-h-[250px]" />
        </div>
      </div>
    );
  }
);
