import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuButtonItem,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { useAppState } from '@/hooks/use-app-state';

export function ShadcnCliVersionSelector() {
  const { cliVersion, setCliVersion } = useAppState();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="font-medium text-foreground text-sm">
            Shadcn CLI version
          </div>
          <div className="text-muted-foreground text-xs">
            Set your preferred shadcn CLI version.
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuButton>
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-2 rounded-md text-xs"
            >
              {cliVersion === 'v2' && 'v2'}
              {cliVersion === 'v3' && 'v3'}
            </Button>
          </DropdownMenuButton>
          <DropdownMenuContent>
            <DropdownMenuButtonItem
              onClick={() => setCliVersion('v2')}
              className="flex items-center gap-2"
            >
              v2
            </DropdownMenuButtonItem>
            <DropdownMenuButtonItem
              onClick={() => setCliVersion('v3')}
              className="flex items-center gap-2"
            >
              v3
            </DropdownMenuButtonItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
