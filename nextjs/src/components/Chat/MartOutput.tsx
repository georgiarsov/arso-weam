import { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// @ts-ignore - rehype-raw types may not be available
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyToClipboard from 'react-copy-to-clipboard';
import CopyIcon from '@/icons/CopyIcon';
import CheckIcon from '@/icons/CheckIcon';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TickIcon from '@/icons/TickIcon';

// Helper function to detect if code is n8n workflow JSON
const isN8nWorkflowJson = (code: string): boolean => {
    try {
        const parsed = JSON.parse(code);
        // n8n workflow JSON typically has nodes and connections arrays
        // or it could be a workflow export with name, nodes, connections
        const hasNodes = Array.isArray(parsed.nodes);
        const hasConnections = parsed.connections !== undefined;
        const hasWorkflowStructure = hasNodes && hasConnections;
        
        // Also check for common n8n node properties
        if (hasNodes && parsed.nodes.length > 0) {
            const firstNode = parsed.nodes[0];
            const hasN8nNodeStructure = firstNode.type !== undefined && 
                (firstNode.parameters !== undefined || firstNode.position !== undefined);
            return hasWorkflowStructure && hasN8nNodeStructure;
        }
        
        return hasWorkflowStructure;
    } catch {
        return false;
    }
};

// Extract workflow info from n8n JSON
const extractWorkflowInfo = (code: string): { name?: string; id?: string } | null => {
    try {
        const parsed = JSON.parse(code);
        return {
            name: parsed.name,
            id: parsed.id
        };
    } catch {
        return null;
    }
};

const CodeBlock = (props) => {
    const { children, className, node, onSaveWorkflow, existingWorkflowId, ...rest } = props;
    const isInline = !className;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;

    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const codeString = String(children).replace(/\n$/, '');
    
    // Check if this is n8n workflow JSON
    // Allow both explicit json language tag OR auto-detect from content
    const isWorkflowJson = useMemo(() => {
        // If language is specified and not json, skip
        if (language && language !== 'json') return false;
        // Check if the content is valid n8n workflow JSON
        return isN8nWorkflowJson(codeString);
    }, [codeString, language]);
    
    // Extract workflow info if it's a workflow JSON
    const workflowInfo = useMemo(() => {
        if (!isWorkflowJson) return null;
        return extractWorkflowInfo(codeString);
    }, [codeString, isWorkflowJson]);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleSaveWorkflow = async (isUpdate: boolean) => {
        if (!onSaveWorkflow) return;
        setSaving(true);
        try {
            await onSaveWorkflow(codeString, language, isUpdate, workflowInfo);
        } finally {
            setSaving(false);
        }
    };

    if (isInline) {
        const text = Array.isArray(children) ? children.join('') : children;
        return (
            <code
                className="px-1 py-0.5 rounded bg-[#ECECEC] text-[#2D2D2D] text-sm font-mono"
                {...props}
            >
                {text}
            </code>
        );
    }

    return (
        <>
            {match ? (
                <>
                    <div className="flex justify-between px-3 align-middle pt-1">
                        <p className="language-text">{language}</p>
                        <div className="flex items-center gap-3">
                            {/* Only show workflow buttons for n8n workflow JSON */}
                            {onSaveWorkflow && isWorkflowJson && (
                                <>
                                    {workflowInfo?.id || existingWorkflowId ? (
                                        <button
                                            onClick={() => handleSaveWorkflow(true)}
                                            disabled={saving}
                                            className="cursor-pointer language-text hover:text-green-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                                            title="Update Workflow to n8n"
                                        >
                                            <span>{saving ? 'Updating...' : 'Update Workflow to n8n'}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSaveWorkflow(false)}
                                            disabled={saving}
                                            className="cursor-pointer language-text hover:text-green-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                                            title="Save to n8n"
                                        >
                                            <span>{saving ? 'Saving...' : 'Save to n8n'}</span>
                                        </button>
                                    )}
                                </>
                            )}
                            <CopyToClipboard text={children} onCopy={handleCopy}>
                                <div className="flex">
                                    {copied ? (
                                        <span className="language-text">
                                            <CheckIcon
                                                width={12}
                                                height={12}
                                                className="mr-2 inline-block [&>path]:fill-gray-200"
                                            />
                                            Copied!
                                        </span>
                                    ) : (
                                        <span className="cursor-pointer language-text">
                                            <CopyIcon
                                                width={15}
                                                height={15}
                                                className="mr-2 inline-block [&>path]:fill-gray-200"
                                            />
                                            Copy code
                                        </span>
                                    )}
                                </div>
                            </CopyToClipboard>
                        </div>
                    </div>
                    <SyntaxHighlighter
                        PreTag="div"
                        language={match[1]}
                        style={dark}
                        wrapLines={true}
                        wrapLongLines={true}
                    >
                        {codeString}
                    </SyntaxHighlighter>
                </>
            ) : (
                <code {...rest} className={className}>
                    {children}
                </code>
            )}
        </>
    );
};

export const MarkOutPut = (
    assisnantResponse: string, 
    onSaveWorkflow?: (code: string, language: string, isUpdate: boolean, workflowInfo?: { name?: string; id?: string } | null) => void,
    existingWorkflowId?: string
) => {
    const processedResponse = assisnantResponse.replace(/==(.*?)==/g, '<u>$1</u>');

    const CodeBlockWithSave = (props: any) => <CodeBlock {...props} onSaveWorkflow={onSaveWorkflow} existingWorkflowId={existingWorkflowId} />;

    return (
        <div className="markdown w-full mx-auto flex-1 prose max-w-full overflow-hidden">
            <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    // Override how links <a> are rendered
                    code: CodeBlockWithSave,
                    table: ({ children }) => {
                        const [copied, setCopied] = useState(false);
                        const [colSize, setColSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('sm');
                        const tableRef = (el: HTMLTableElement | null) => {
                            if (!el) return;
                            const computeAndSetSize = () => {
                                const firstRow = el.querySelector('tr');
                                const colCount = firstRow ? firstRow.children.length : 0;
                                let size: 'sm' | 'md' | 'lg' | 'xl' = 'sm';
                                if (colCount > 12) size = 'xl';
                                else if (colCount > 6) size = 'lg';
                                else if (colCount > 4) size = 'md';
                                setColSize(size);
                                el.setAttribute('data-col-size', size);
                                el.setAttribute('data-col-count', String(colCount));
                            };
                            computeAndSetSize();
                            try {
                                const ro = new ResizeObserver(() => computeAndSetSize());
                                ro.observe(el);
                                (el as any).__ro = ro;
                            } catch (_) { }
                        };
                        const handleCopyTable = (tableElement: HTMLTableElement | null) => {
                            if (!tableElement) return;
                            const rows = Array.from(tableElement.querySelectorAll('tr'));
                            const tsv = rows
                                .map((row) =>
                                    Array.from(row.querySelectorAll('th,td'))
                                        .map((cell) => {
                                            const text = (cell.textContent || '').replace(/\t/g, ' ').replace(/\r?\n|\r/g, ' ');
                                            // Quote if contains tabs or quotes
                                            const needsQuotes = /["\t]/.test(text);
                                            const escaped = text.replace(/"/g, '""');
                                            return needsQuotes ? `"${escaped}"` : escaped;
                                        })
                                        .join('\t')
                                )
                                .join('\n');
                            const html = tableElement.outerHTML;
                            const writeRichClipboard = async () => {
                                try {
                                    const ClipboardItemCtor: any = (window as any).ClipboardItem;
                                    if (ClipboardItemCtor) {
                                        const item = new ClipboardItemCtor({
                                            'text/html': new Blob([html], { type: 'text/html' }),
                                            'text/plain': new Blob([tsv], { type: 'text/plain' })
                                        });
                                        await navigator.clipboard.write([item]);
                                    } else {
                                        await navigator.clipboard.writeText(tsv);
                                    }
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 1500);
                                } catch (e) {
                                    navigator.clipboard.writeText(tsv).then(() => {
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 1500);
                                    });
                                }
                            };
                            writeRichClipboard();
                        };
                        return (
                            <div className="relative group markdown-table-wrap w-full">
                                <div className="md:absolute right-0 top-[-2px] flex items-center gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10">
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="rounded p-1.5 bg-b4 hover:bg-b2"
                                                    onClick={(e) => {
                                                        const wrapper = (e.currentTarget.parentElement?.parentElement?.parentElement as HTMLElement) || null;
                                                        const table = wrapper ? (wrapper.querySelector('table') as HTMLTableElement) : null;
                                                        handleCopyTable(table);
                                                    }}
                                                    aria-label="Copy table"
                                                >
                                                    {copied ? (
                                                        <TickIcon width={14} height={14} className="[&>path]:fill-green w-4 h-auto" />
                                                    ) : (
                                                        <CopyIcon width={14} height={14} className="[&>path]:fill-white w-4 h-auto" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="border-none text-white">
                                                <span className='text-font-14'>Copy Table</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table ref={tableRef} className="min-w-full">{children}</table>
                                </div>
                            </div>
                        );
                    },
                    a: ({ children, href, ...props }) => {
                        // children is normally an array of strings/elements
                        // e.g. if the markdown is [1](https://google.com)
                        // the displayed text is '1'
                        const linkText = children[0];

                        // Check if linkText is purely numeric (like "1", "2", "3"...)
                        const isNumericRef = /^\d+$/.test(linkText);

                        // If numeric, style as a circle
                        if (isNumericRef) {
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center 
                               size-[18px] text-font-12 bg-b12 mr-1 mb-1 text-sm font-medium 
                               rounded-full 
                               text-b2"
                                    {...props}
                                >
                                    {linkText}
                                </a>
                            );
                        }

                        // Otherwise, render normal link
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-b5 underline"
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    },
                }}
            >
                {processedResponse}
            </Markdown>
        </div>
    );
};
