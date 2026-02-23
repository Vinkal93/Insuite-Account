import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSettings, updateSettings } from '../db/database';

type Theme = 'light' | 'dark' | 'system';
type ColorTheme = 'frosted' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'rose' | 'monochrome';

// Color theme definitions
export const COLOR_THEMES: Record<ColorTheme, {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    preview: string[];
}> = {
    monochrome: {
        name: 'Monochrome',
        primary: '#374151',
        secondary: '#6b7280',
        accent: '#111827',
        preview: ['#111827', '#374151', '#6b7280', '#e5e7eb']
    },
    frosted: {
        name: 'Frosted Aqua',
        primary: '#7bdff2',
        secondary: '#b2f7ef',
        accent: '#f2b5d4',
        preview: ['#7bdff2', '#b2f7ef', '#eff7f6', '#f2b5d4']
    },
    ocean: {
        name: 'Ocean Blue',
        primary: '#0077b6',
        secondary: '#00b4d8',
        accent: '#90e0ef',
        preview: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8']
    },
    sunset: {
        name: 'Sunset Orange',
        primary: '#ff6b35',
        secondary: '#f7c59f',
        accent: '#efa00b',
        preview: ['#ff6b35', '#f7c59f', '#efa00b', '#2e294e']
    },
    forest: {
        name: 'Forest Green',
        primary: '#2d6a4f',
        secondary: '#40916c',
        accent: '#74c69d',
        preview: ['#2d6a4f', '#40916c', '#74c69d', '#b7e4c7']
    },
    lavender: {
        name: 'Lavender Purple',
        primary: '#7b2cbf',
        secondary: '#9d4edd',
        accent: '#c77dff',
        preview: ['#7b2cbf', '#9d4edd', '#c77dff', '#e0aaff']
    },
    rose: {
        name: 'Rose Pink',
        primary: '#e63946',
        secondary: '#f4a6a6',
        accent: '#ff8fa3',
        preview: ['#e63946', '#f4a6a6', '#ff8fa3', '#ffccd5']
    }
};

type ButtonStyle = 'solid' | 'gradient';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
    colorTheme: ColorTheme;
    setColorTheme: (theme: ColorTheme) => void;
    buttonStyle: ButtonStyle;
    setButtonStyle: (style: ButtonStyle) => void;
    customColor: string;
    setCustomColor: (color: string) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [colorTheme, setColorThemeState] = useState<ColorTheme>('frosted');
    const [buttonStyle, setButtonStyleState] = useState<ButtonStyle>('gradient');
    const [customColor, setCustomColorState] = useState<string>('#7bdff2');
    const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

    // Load theme from database on mount
    useEffect(() => {
        async function loadTheme() {
            const settings = await getSettings();
            if (settings?.theme) setThemeState(settings.theme);
            if (settings?.colorTheme) setColorThemeState(settings.colorTheme as ColorTheme);
            if (settings?.buttonStyle) setButtonStyleState(settings.buttonStyle as ButtonStyle);
            if (settings?.customColor) setCustomColorState(settings.customColor);
        }
        loadTheme();

        // Load sidebar state from localStorage
        const savedSidebar = localStorage.getItem('sidebarCollapsed');
        if (savedSidebar) setSidebarCollapsedState(savedSidebar === 'true');
    }, []);

    // Handle system theme changes and resolve theme
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        function updateResolvedTheme() {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme);
            }
        }

        updateResolvedTheme();
        mediaQuery.addEventListener('change', updateResolvedTheme);

        return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolvedTheme);
    }, [resolvedTheme]);

    // Apply color theme CSS variables
    useEffect(() => {
        const colors = COLOR_THEMES[colorTheme];
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
        document.documentElement.style.setProperty('--theme-accent', colors.accent);
        document.documentElement.setAttribute('data-color-theme', colorTheme);
        document.documentElement.setAttribute('data-button-style', buttonStyle);
    }, [colorTheme, buttonStyle]);

    // Apply custom color
    useEffect(() => {
        document.documentElement.style.setProperty('--custom-primary', customColor);
    }, [customColor]);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        await updateSettings({ theme: newTheme });
    };

    const setColorTheme = async (newColorTheme: ColorTheme) => {
        setColorThemeState(newColorTheme);
        await updateSettings({ colorTheme: newColorTheme });
    };

    const setButtonStyle = async (style: ButtonStyle) => {
        setButtonStyleState(style);
        await updateSettings({ buttonStyle: style });
    };

    const setCustomColor = async (color: string) => {
        setCustomColorState(color);
        await updateSettings({ customColor: color });
    };

    const setSidebarCollapsed = (collapsed: boolean) => {
        setSidebarCollapsedState(collapsed);
        localStorage.setItem('sidebarCollapsed', String(collapsed));
    };

    return (
        <ThemeContext.Provider value={{
            theme, setTheme, resolvedTheme,
            colorTheme, setColorTheme,
            buttonStyle, setButtonStyle,
            customColor, setCustomColor,
            sidebarCollapsed, setSidebarCollapsed
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
