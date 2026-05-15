import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const badgeVariants = cva(
	'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
	{
		variants: {
			color: {
				default: 'bg-secondary text-foreground',
				primary: 'bg-primary text-primary-foreground',
				success: 'bg-green-900/40 text-green-400 border border-green-800',
				info: 'bg-blue-900/40 text-blue-400 border border-blue-800',
				error: 'bg-red-900/40 text-destructive border border-red-800',
				warning: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800',
				secondary: 'bg-secondary text-muted-foreground',
			},
			variant: {
				filled: '',
				outline: 'bg-transparent border border-current',
			},
			size: {
				default: 'px-2 py-0.5 text-xs',
				sm: 'px-1.5 py-px text-[10px]',
			},
		},
		defaultVariants: {
			color: 'default',
			variant: 'filled',
			size: 'default',
		},
	},
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
	label: string;
	className?: string;
}

export function Badge({ label, color, variant, size, className }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ color, variant, size }), className)}>
			{label}
		</span>
	);
}
