'use client';
import { useState } from 'react';
import { cn } from './cn';

interface TooltipProps {
	title: string;
	children: React.ReactNode;
	className?: string;
}

export function Tooltip({ title, children, className }: TooltipProps) {
	const [visible, setVisible] = useState(false);

	return (
		<span
			className={cn('relative inline-flex', className)}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onBlur={() => setVisible(false)}
		>
			{children}
			{visible && (
				<span
					role="tooltip"
					className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-secondary px-2 py-1 text-xs text-foreground shadow-md z-50"
				>
					{title}
				</span>
			)}
		</span>
	);
}
