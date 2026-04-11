import { MessageSquare, Bot, LogOut, FileText, Clock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ModeToggle } from './ModeToggle'

export type NavItem = 'chat' | 'bot-management' | 'cron-management' | 'webhook-management' | 'webhook-log' | 'documentation' | 'trigger-editor' | 'cron-editor' | 'webhook-editor'

interface NavigationSidebarProps {
    activeItem: NavItem
    onNavItemSelect: (item: NavItem) => void
    onLogout: () => void
    isConnected?: boolean
}

export function NavigationSidebar({ activeItem, onNavItemSelect, onLogout, isConnected }: NavigationSidebarProps) {    
    return (
        <div className='w-[68px] h-full flex flex-col items-center py-6 bg-background border-r border-border/40 flex-shrink-0 z-50'>
            {/* Top Section */}
            <div className='flex flex-col gap-4 flex-1'>
                <NavButton
                    icon={<MessageSquare className='h-5 w-5' />}
                    label='Chats'
                    isActive={activeItem === 'chat'}
                    onClick={() => onNavItemSelect('chat')}
                />
                <NavButton
                    icon={<Bot className='h-5 w-5' />}
                    label='Triggers'
                    isActive={activeItem === 'bot-management' || activeItem === 'trigger-editor'}
                    onClick={() => onNavItemSelect('bot-management')}
                />
                <NavButton
                    icon={<Clock className='h-5 w-5' />}
                    label='Cron Jobs'
                    isActive={activeItem === 'cron-management' || activeItem === 'cron-editor'}
                    onClick={() => onNavItemSelect('cron-management')}
                />
                <NavButton
                    icon={<Globe className='h-5 w-5' />}
                    label='Webhooks'
                    isActive={activeItem === 'webhook-management' || activeItem === 'webhook-editor'}
                    onClick={() => onNavItemSelect('webhook-management')}
                />
                <NavButton
                    icon={<FileText className='h-5 w-5' />}
                    label='Documentation'
                    isActive={activeItem === 'documentation'}
                    onClick={() => onNavItemSelect('documentation')}
                />
            </div>
            {/* Bottom Section */}
            <div className='flex flex-col items-center gap-4 mt-auto'>
                <ModeToggle />

                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <div className='relative group/logout'>
                            <button
                                onClick={onLogout}
                                className='p-3.5 rounded-2xl transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                            >
                                <LogOut className='h-5 w-5' />
                            </button>
                            <div className={cn(
                                'absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-background transition-colors duration-500',
                                isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                            )} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side='right' sideOffset={10} className='font-medium'>
                        <p>Log out ({isConnected ? 'Connected' : 'Reconnecting...'})</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    )
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className={cn(
                        'p-3.5 rounded-2xl transition-all duration-200 group relative',
                        isActive
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                >
                    {icon}
                    {isActive && (
                        <div className='absolute -left-[14px] top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full' />
                    )}
                </button>
            </TooltipTrigger>
            <TooltipContent side='right' sideOffset={10} className='font-medium'>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    )
}
