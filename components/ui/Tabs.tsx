'use client';
import { useState } from 'react';
import { cn } from './cn';

interface TabItem {
	label: string;
	component: React.ReactNode;
	disabled?: boolean;
}

interface TabsProps {
	tabs: TabItem[];
	fixed?: boolean;
}

export default function Tabs({ tabs, fixed = false }: TabsProps) {
	const [activeIndex, setActiveIndex] = useState(0);

	const tabBar = (
		<div className="flex border-b border-border" role="tablist">
			{tabs.map((tab, index) => (
				<button
					key={index}
					role="tab"
					id={`tab-${index}`}
					aria-controls={`tabpanel-${index}`}
					aria-selected={activeIndex === index}
					disabled={tab.disabled}
					onClick={() => setActiveIndex(index)}
					className={cn(
						'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
						activeIndex === index
							? 'border-primary text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
						tab.disabled && 'opacity-40 cursor-not-allowed',
					)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);

	const panels = tabs.map((tab, index) => (
		<div
			key={index}
			role="tabpanel"
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			hidden={activeIndex !== index}
			className="p-4"
		>
			{activeIndex === index && tab.component}
		</div>
	));

	if (fixed) {
		return (
			<div className="flex flex-col h-screen">
				<div className="sticky top-14 z-40 bg-background">{tabBar}</div>
				<div className="flex-1 overflow-y-auto">{panels}</div>
			</div>
		);
	}

	return (
		<div className="w-full">
			{tabBar}
			{panels}
		</div>
	);
}
