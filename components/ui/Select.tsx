import { cn } from './cn';

export interface SelectOption {
	value: string | number;
	label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	options: SelectOption[];
	fullWidth?: boolean;
	placeholder?: string;
}

export function Select({ label, options, fullWidth, placeholder, className, id, ...props }: SelectProps) {
	const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

	return (
		<div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
			{label && (
				<label htmlFor={selectId} className="text-sm font-medium text-foreground">
					{label}
				</label>
			)}
			<select
				id={selectId}
				className={cn(
					'h-9 rounded-md border border-white/25 bg-card px-3 py-1 text-sm text-foreground',
					'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					fullWidth && 'w-full',
					className,
				)}
				{...props}
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}
