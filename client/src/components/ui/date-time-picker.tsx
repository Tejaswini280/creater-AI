"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  compact?: boolean
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Pick a date and time",
  disabled = false,
  compact = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const periods = ["AM", "PM"]

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // If we already have a time set, preserve it
      if (date) {
        const newDate = new Date(selectedDate)
        newDate.setHours(date.getHours())
        newDate.setMinutes(date.getMinutes())
        setDate(newDate)
      } else {
        // Don't set any default time - user must explicitly select time
        setDate(selectedDate)
      }
    }
  }

  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string) => {
    if (!date) return

    const newDate = new Date(date)
    const currentHour = date.getHours()

    switch (type) {
      case 'hour':
        const hour = parseInt(value)
        const isPM = currentHour >= 12

        if (isPM && hour !== 12) {
          newDate.setHours(hour + 12)
        } else if (!isPM && hour === 12) {
          newDate.setHours(0)
        } else if (isPM && hour === 12) {
          newDate.setHours(12)
        } else {
          newDate.setHours(hour)
        }
        break

      case 'minute':
        newDate.setMinutes(parseInt(value))
        break

      case 'period':
        if (value === 'AM' && currentHour >= 12) {
          newDate.setHours(currentHour - 12)
        } else if (value === 'PM' && currentHour < 12) {
          newDate.setHours(currentHour + 12)
        }
        break
    }

    setDate(newDate)
  }

  const formatTimeForDisplay = (date: Date) => {
    const hour = date.getHours()
    const minute = date.getMinutes()
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  const getCurrentTimeValues = () => {
    if (!date) return { hour: '12', minute: '00', period: 'AM' }

    const hour = date.getHours()
    const minute = date.getMinutes()
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

    return {
      hour: displayHour.toString(),
      minute: minute.toString().padStart(2, '0'),
      period
    }
  }

  const { hour, minute, period } = getCurrentTimeValues()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            compact ? "justify-start text-left font-normal" : "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
          size={compact ? "sm" : "default"}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            compact ? (
              format(date, "MMM d, h:mm a")
            ) : (
              <>
                {format(date, "PPP")} at {formatTimeForDisplay(date)}
              </>
            )
          ) : (
            <span>{compact ? "Set time" : placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", compact && "w-80")} align="start">
        <div className={cn("p-3", compact && "p-2")}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <div className="flex gap-2">
              <Select value={hour} onValueChange={(value) => handleTimeChange('hour', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={minute} onValueChange={(value) => handleTimeChange('minute', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                      {m.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={(value) => handleTimeChange('period', value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDate(undefined)
                setIsOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!date}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
