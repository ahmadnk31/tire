"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const fetchUsers = async () => {
  const response = await axios.get('/api/users/search');
  return response.data.users;
};

// Use default export instead of named export
const UserSelector = ({ value, onChange }: UserSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const selectedUser = users.find((user: User) => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.image || ""} alt={selectedUser.name} />
                <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{selectedUser.name}</span>
            </div>
          ) : (
            "Select user..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search users..." onValueChange={setSearchQuery} />
          {isLoading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <div className="p-2 text-center text-sm text-red-500">
              Error loading users
            </div>
          ) : (
            <>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {users
                  .filter((user: User) => 
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user: User) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        onChange(user.id === value ? "" : user.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || ""} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSelector;