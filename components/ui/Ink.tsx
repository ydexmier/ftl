export const types = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

interface InkProps {
	type: string | string[];
	width?: number | string;
}

export default function Ink({ type, width = 100 }: InkProps) {
	const size = typeof width === 'number' ? `${width}px` : width;
	const isBicolor = Array.isArray(type) && type.length > 1;

	const srcs: string[] = Array.isArray(type)
		? type.map((ink) => `/svg/${ink.toLowerCase()}.svg`)
		: type
			? [`/svg/${type.toLowerCase()}.svg`]
			: ['/svg/unknow-ink.svg'];

	return (
		<div style={{ position: 'relative', width: size, aspectRatio: '1 / 1', overflow: 'hidden' }}>
			{srcs.map((src, i) => (
				<img
					key={src}
					src={src}
					alt={src}
					style={{
						position: isBicolor ? 'absolute' : 'static',
						top: 0,
						width: isBicolor ? '200%' : '100%',
						height: '100%',
						objectFit: 'contain',
						display: 'block',
						...(isBicolor && i === 0 ? { left: 0, clipPath: 'inset(0 50% 0 0)' } : {}),
						...(isBicolor && i === 1 ? { right: 0, left: 'auto', clipPath: 'inset(0 0 0 50%)' } : {}),
					}}
				/>
			))}
		</div>
	);
}
