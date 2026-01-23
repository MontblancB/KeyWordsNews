'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface KeywordNode {
  id: string
  text: string
  count: number
  value: number
  newsIds: string[]
}

interface KeywordLink {
  source: string
  target: string
  strength: number
}

interface BubbleMapVisualizationProps {
  keywords: KeywordNode[]
  links: KeywordLink[]
  onKeywordClick?: (keyword: KeywordNode) => void
}

/**
 * BubbleMapVisualization
 *
 * D3.js Force Graph를 사용한 키워드 버블맵 시각화
 * - 버블 크기: 키워드 가중치
 * - 연결선: 키워드 간 상관관계
 * - 인터랙션: 호버, 클릭, 드래그, 줌
 */
export default function BubbleMapVisualization({
  keywords,
  links,
  onKeywordClick,
}: BubbleMapVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredKeyword, setHoveredKeyword] = useState<KeywordNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // 반응형 크기 조정
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width || 800,
          height: Math.max(rect.height, 600),
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // D3.js 시각화
  useEffect(() => {
    if (!svgRef.current || keywords.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // 기존 요소 제거

    const { width, height } = dimensions

    // SVG 그룹 생성 (줌/팬 적용)
    const g = svg.append('g')

    // 줌 기능 추가
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // 노드 데이터 준비
    const nodes = keywords.map((kw) => ({
      ...kw,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }))

    // 링크 데이터 준비
    const linkData = links.map((link) => ({
      source: nodes.find((n) => n.id === link.source)!,
      target: nodes.find((n) => n.id === link.target)!,
      strength: link.strength,
    }))

    // 색상 스케일 (빈도에 따라 색상 변경)
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(nodes, (d) => d.count) || 1])

    // Force Simulation 설정
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(linkData)
          .id((d: any) => d.id)
          .distance(100)
          .strength((d: any) => d.strength * 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => Math.sqrt(d.value) * 8 + 5)
      )

    // 링크 그리기
    const link = g
      .append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d) => d.strength * 3)

    // 노드 그룹 생성
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3
          .drag()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }) as any
      )

    // 버블 원 그리기
    node
      .append('circle')
      .attr('r', (d) => Math.sqrt(d.value) * 8)
      .attr('fill', (d) => colorScale(d.count))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        setHoveredKeyword(d)
        d3.select(this).attr('stroke', '#ff6b6b').attr('stroke-width', 3)
      })
      .on('mouseleave', function () {
        setHoveredKeyword(null)
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2)
      })
      .on('click', (event, d) => {
        if (onKeywordClick) {
          onKeywordClick(d)
        }
      })

    // 텍스트 라벨
    node
      .append('text')
      .text((d) => d.text)
      .attr('font-size', (d) => Math.max(10, Math.sqrt(d.value) * 2))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    // 빈도 표시 (작은 텍스트)
    node
      .append('text')
      .text((d) => `(${d.count})`)
      .attr('font-size', (d) => Math.max(8, Math.sqrt(d.value) * 1.5))
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .attr('fill', '#fff')
      .attr('opacity', 0.8)
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    // Simulation 업데이트
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // 클린업
    return () => {
      simulation.stop()
    }
  }, [keywords, links, dimensions, onKeywordClick])

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      />

      {/* 호버 툴팁 */}
      {hoveredKeyword && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="font-bold text-lg mb-2">{hoveredKeyword.text}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            언급 횟수: <span className="font-semibold">{hoveredKeyword.count}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            가중치: <span className="font-semibold">{hoveredKeyword.value.toFixed(1)}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            관련 뉴스: <span className="font-semibold">{hoveredKeyword.newsIds.length}개</span>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
        <div className="font-semibold mb-2">범례</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>크기 = 키워드 가중치</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400" />
            <span>선 = 키워드 상관관계</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">
            💡 드래그/줌/클릭 가능
          </div>
        </div>
      </div>
    </div>
  )
}
