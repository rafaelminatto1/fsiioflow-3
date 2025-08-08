'use client'

import React from 'react'
import { PainPoint } from '@/types/prisma'
import { getPainColorByIntensity } from '@/lib/utils'

interface BodyMapSVGProps {
  side: 'FRONT' | 'BACK'
  painPoints: PainPoint[]
  onPointClick?: (x: number, y: number) => void
  onPainPointClick?: (painPoint: PainPoint) => void
  isInteractive?: boolean
  width?: number
  height?: number
}

export function BodyMapSVG({
  side,
  painPoints,
  onPointClick,
  onPainPointClick,
  isInteractive = true,
  width = 400,
  height = 600
}: BodyMapSVGProps) {
  const handleSVGClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isInteractive || !onPointClick) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    onPointClick(x, y)
  }

  const handlePainPointClick = (painPoint: PainPoint, event: React.MouseEvent) => {
    event.stopPropagation()
    if (onPainPointClick) {
      onPainPointClick(painPoint)
    }
  }

  // SVG do corpo humano - frente
  const frontBodyPath = `
    M200 50
    C180 50 160 70 160 90
    L160 120
    C160 130 150 140 140 150
    L120 180
    L120 220
    C120 240 110 250 100 260
    L100 400
    L90 500
    L90 580
    L110 580
    L110 500
    L120 400
    L140 260
    C150 250 160 240 160 220
    L160 180
    L180 150
    C190 140 200 130 200 120
    L200 90
    C200 70 220 50 240 50
    C260 50 280 70 280 90
    L280 120
    C280 130 290 140 300 150
    L320 180
    L320 220
    C320 240 330 250 340 260
    L340 400
    L350 500
    L350 580
    L330 580
    L330 500
    L320 400
    L300 260
    C290 250 280 240 280 220
    L280 180
    L260 150
    C250 140 240 130 240 120
    L240 90
    C240 70 220 50 200 50
    Z
  `

  // SVG do corpo humano - costas
  const backBodyPath = `
    M200 50
    C180 50 160 70 160 90
    L160 120
    C160 130 150 140 140 150
    L120 180
    L120 220
    C120 240 110 250 100 260
    L100 400
    L90 500
    L90 580
    L110 580
    L110 500
    L120 400
    L140 260
    C150 250 160 240 160 220
    L160 180
    L180 150
    C190 140 200 130 200 120
    L200 90
    C200 70 220 50 240 50
    C260 50 280 70 280 90
    L280 120
    C280 130 290 140 300 150
    L320 180
    L320 220
    C320 240 330 250 340 260
    L340 400
    L350 500
    L350 580
    L330 580
    L330 500
    L320 400
    L300 260
    C290 250 280 240 280 220
    L280 180
    L260 150
    C250 140 240 130 240 120
    L240 90
    C240 70 220 50 200 50
    Z
  `

  const bodyPath = side === 'FRONT' ? frontBodyPath : backBodyPath

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 600"
        className={`border border-gray-200 rounded-lg bg-white ${
          isInteractive ? 'cursor-crosshair' : ''
        }`}
        onClick={handleSVGClick}
      >
        {/* Fundo do corpo */}
        <path
          d={bodyPath}
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="2"
          className="transition-colors hover:fill-blue-50"
        />

        {/* Linhas de referência anatômica */}
        {side === 'FRONT' && (
          <g stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" opacity="0.5">
            {/* Linha central */}
            <line x1="200" y1="50" x2="200" y2="580" />
            {/* Linha dos ombros */}
            <line x1="120" y1="120" x2="280" y2="120" />
            {/* Linha da cintura */}
            <line x1="140" y1="260" x2="260" y2="260" />
            {/* Linha dos quadris */}
            <line x1="120" y1="320" x2="280" y2="320" />
            {/* Linha dos joelhos */}
            <line x1="100" y1="450" x2="300" y2="450" />
          </g>
        )}

        {side === 'BACK' && (
          <g stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" opacity="0.5">
            {/* Linha central */}
            <line x1="200" y1="50" x2="200" y2="580" />
            {/* Linha dos ombros */}
            <line x1="120" y1="120" x2="280" y2="120" />
            {/* Linha da cintura */}
            <line x1="140" y1="260" x2="260" y2="260" />
            {/* Linha dos quadris */}
            <line x1="120" y1="320" x2="280" y2="320" />
            {/* Linha dos joelhos */}
            <line x1="100" y1="450" x2="300" y2="450" />
          </g>
        )}

        {/* Regiões anatômicas principais */}
        {side === 'FRONT' && (
          <g>
            {/* Cabeça */}
            <circle
              cx="200"
              cy="75"
              r="25"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="head"
            />
            
            {/* Pescoço */}
            <rect
              x="185"
              y="100"
              width="30"
              height="20"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="neck"
            />
            
            {/* Tórax */}
            <ellipse
              cx="200"
              cy="180"
              rx="60"
              ry="40"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="chest"
            />
            
            {/* Abdomen */}
            <ellipse
              cx="200"
              cy="240"
              rx="50"
              ry="30"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="abdomen"
            />
            
            {/* Braços */}
            <ellipse
              cx="120"
              cy="200"
              rx="15"
              ry="60"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="left-arm"
            />
            <ellipse
              cx="280"
              cy="200"
              rx="15"
              ry="60"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="right-arm"
            />
            
            {/* Coxas */}
            <ellipse
              cx="170"
              cy="380"
              rx="20"
              ry="50"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="left-thigh"
            />
            <ellipse
              cx="230"
              cy="380"
              rx="20"
              ry="50"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="right-thigh"
            />
            
            {/* Pernas */}
            <ellipse
              cx="170"
              cy="500"
              rx="15"
              ry="40"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="left-leg"
            />
            <ellipse
              cx="230"
              cy="500"
              rx="15"
              ry="40"
              fill="transparent"
              stroke="#cbd5e1"
              strokeWidth="1"
              data-region="right-leg"
            />
          </g>
        )}

        {/* Pontos de dor */}
        {painPoints.map((point, index) => (
          <g key={index}>
            {/* Círculo do ponto de dor */}
            <circle
              cx={(point.x / 100) * 400}
              cy={(point.y / 100) * 600}
              r={8 + (point.intensity * 2)}
              fill={getPainColorByIntensity(point.intensity)}
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200 hover:stroke-4"
              onClick={(e) => handlePainPointClick(point, e)}
            />
            
            {/* Número da intensidade */}
            <text
              x={(point.x / 100) * 400}
              y={(point.y / 100) * 600 + 5}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="white"
              className="pointer-events-none select-none"
            >
              {point.intensity}
            </text>
            
            {/* Tooltip hover */}
            <title>
              {`${point.bodyPart} - Intensidade: ${point.intensity}/10
Tipo: ${point.painType}
${point.description ? `Descrição: ${point.description}` : ''}`}
            </title>
          </g>
        ))}

        {/* Legenda de intensidade */}
        <g transform="translate(10, 10)">
          <rect
            x="0"
            y="0"
            width="120"
            height="140"
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#e2e8f0"
            strokeWidth="1"
            rx="4"
          />
          <text x="60" y="15" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">
            Escala de Dor
          </text>
          
          {[0, 2, 4, 6, 8, 10].map((intensity) => (
            <g key={intensity} transform={`translate(10, ${25 + intensity * 15})`}>
              <circle
                cx="8"
                cy="8"
                r="6"
                fill={getPainColorByIntensity(intensity)}
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text x="20" y="12" fontSize="10" fill="#374151">
                {intensity} - {intensity === 0 ? 'Sem dor' : 
                  intensity <= 2 ? 'Leve' :
                  intensity <= 5 ? 'Moderada' :
                  intensity <= 8 ? 'Intensa' : 'Insuportável'}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
