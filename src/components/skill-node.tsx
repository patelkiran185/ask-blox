import { Handle, Position, type NodeProps } from "reactflow"
import { Badge } from "./ui/badge"
import { Target, AlertTriangle, CheckCircle, Brain } from "lucide-react"
import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SkillNodeData {
  label: string
  type: "matched" | "gap" | "strength" | "center"
  description?: string
  confidence?: number
  talkingPoint?: string; 
}

export function SkillNode({ data }: NodeProps<SkillNodeData>) {
  console.log('SkillNode data:', data);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getNodeStyle = () => {
    switch (data.type) {
      case "matched":
        return {
          bg: "bg-blue-900/80",
          border: "border-blue-500",
          text: "text-blue-100",
          icon: Target,
          iconColor: "text-blue-400",
        }
      case "gap":
        return {
          bg: "bg-red-900/80",
          border: "border-red-500",
          text: "text-red-100",
          icon: AlertTriangle,
          iconColor: "text-red-400",
        }
      case "strength":
        return {
          bg: "bg-green-900/80",
          border: "border-green-500",
          text: "text-green-100",
          icon: CheckCircle,
          iconColor: "text-green-400",
        }
      case "center":
        return {
          bg: "bg-gradient-to-br from-blue-900/90 to-purple-900/90",
          border: "border-blue-400",
          text: "text-blue-100",
          icon: Brain,
          iconColor: "text-blue-300",
        }
      default:
        return {
          bg: "bg-gray-900/80",
          border: "border-gray-500",
          text: "text-gray-100",
          icon: Target,
          iconColor: "text-gray-400",
        }
    }
  }

  const style = getNodeStyle()
  const Icon = style.icon

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      console.log('Dialog open state changed:', open);
      setIsDialogOpen(open);
    }}>
      <DialogTrigger asChild>
        <div
          className={`
          ${style.bg} ${style.border} ${style.text}
          border-2 rounded-lg p-4 min-w-[200px] max-w-[250px]
          backdrop-blur-sm shadow-lg hover:shadow-xl
          transition-all duration-300 hover:scale-105
          ${data.type === "center" ? "shadow-blue-500/20" : ""}
          relative
          cursor-pointer
        `}
        >
          <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-blue-300" />

          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 mt-1 ${style.iconColor} flex-shrink-0`} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{data.label}</h3>
              {data.description && <p className="text-xs opacity-80 mb-2">{data.description}</p>}
              {data.confidence && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        data.confidence >= 80 ? "bg-green-500" : data.confidence >= 60 ? "bg-blue-500" : "bg-red-500"
                      }`}
                      style={{ width: `${data.confidence}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {data.confidence}%
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-blue-300" />
        </div>
      </DialogTrigger>

      {data.talkingPoint && (
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-blue-500 text-white">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Talking Point for {data.label}</DialogTitle>
            <DialogDescription className="text-gray-300">
              Strategize your response for the interview.
            </DialogDescription>
          </DialogHeader>
          <p className="text-base leading-relaxed">{data.talkingPoint}</p>
        </DialogContent>
      )}
    </Dialog>
  )
} 