import { useEffect, useMemo, useState } from 'react';
import { themes } from '@/data/themes';

interface AppThemeProviderProps {
	children: React.ReactNode;
}

const STORAGE_KEY = 'wa-bot-theme-preset';

function getLuminance(hex: string) {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
	return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function isValidHex(color: string) {
	return /^#[0-9A-F]{6}$/i.test(color);
}

function hexToRgba(hex: string, opacity: number) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function useAppTheme() {
	const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
	return stored || 'default';
}

export function setAppTheme(name: string) {
	localStorage.setItem(STORAGE_KEY, name);
	window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: name }));
}

export function getStoredTheme() { return useAppTheme(); }

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
	const [currentTheme, setCurrentTheme] = useState(() => useAppTheme());

	const activeTheme = useMemo(() => {
		return themes.find(t => t.name === currentTheme) || themes[0];
	}, [currentTheme]);

	useEffect(() => {
		const handler = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY && e.newValue) {
				setCurrentTheme(e.newValue);
			}
		};
		window.addEventListener('storage', handler);
		return () => window.removeEventListener('storage', handler);
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		const colors = activeTheme.colors;

		const setVar = (name: string, value: string) => {
			if (isValidHex(value)) root.style.setProperty(name, value);
		};

		const primaryLum = getLuminance(colors.blue);
		const primaryForeground = primaryLum > 0.5 ? '#000000' : '#ffffff';

		setVar('--background', colors.background);
		setVar('--foreground', colors.foreground);
		setVar('--card', colors.background);
		setVar('--card-foreground', colors.foreground);
		setVar('--popover', colors.background);
		setVar('--popover-foreground', colors.foreground);
		setVar('--primary', colors.blue);
		setVar('--primary-foreground', primaryForeground);

		const subtleBorder = hexToRgba(colors.foreground, 0.1);
		const subtleAccent = hexToRgba(colors.foreground, 0.05);

		setVar('--secondary', subtleAccent);
		setVar('--secondary-foreground', colors.foreground);
		setVar('--muted', subtleAccent);
		setVar('--muted-foreground', colors.brightBlack);
		setVar('--accent', subtleAccent);
		setVar('--accent-foreground', colors.foreground);
		setVar('--border', subtleBorder);
		setVar('--input', subtleBorder);
		setVar('--ring', colors.blue);

		setVar('--sidebar', colors.background);
		setVar('--sidebar-foreground', colors.foreground);
		setVar('--sidebar-primary', colors.blue);
		setVar('--sidebar-primary-foreground', primaryForeground);
		setVar('--sidebar-accent', subtleAccent);
		setVar('--sidebar-accent-foreground', colors.foreground);
		setVar('--sidebar-border', subtleBorder);
		setVar('--sidebar-ring', colors.blue);

		const bgLum = getLuminance(colors.background);
		root.classList.toggle('dark', bgLum < 0.5);
	}, [activeTheme]);

	return <>{children}</>;
};
