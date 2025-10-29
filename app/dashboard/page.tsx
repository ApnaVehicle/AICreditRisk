'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react'
import { SimpleGauge } from '@/components/dashboard/simple-gauge'
import { ColumnChart } from '@/components/dashboard/column-chart'
import { DonutChart } from '@/components/dashboard/donut-chart'
import { TrendChart } from '@/components/dashboard/trend-chart'
import { useFilterStore } from '@/lib/stores/filter-store'

export default function DashboardPage() {
  const { filters, getQueryParams } = useFilterStore()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<any>(null)
  const [sectorData, setSectorData] = useState<any[]>([])
  const [composition, setComposition] = useState<any>(null)
  const [topRisks, setTopRisks] = useState<any[]>([])
  const [dpdTrends, setDpdTrends] = useState<any>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const params = getQueryParams()

      const [kpisRes, sectorRes, compRes, risksRes, trendsRes] = await Promise.all([
        fetch(`/api/analytics/enhanced-kpis?${params}`).then(r => r.json()),
        fetch(`/api/analytics/sector-exposure?${params}`).then(r => r.json()),
        fetch(`/api/analytics/portfolio-composition?${params}`).then(r => r.json()),
        fetch(`/api/analytics/top-risks?${params}&limit=10`).then(r => r.json()),
        fetch(`/api/analytics/dpd-trends?months=3`).then(r => r.json()),
      ])

      if (kpisRes.success) setKpis(kpisRes.data)
      if (sectorRes.success) setSectorData(sectorRes.data)
      if (compRes.success) setComposition(compRes.data)
      if (risksRes.success) setTopRisks(risksRes.data)
      if (trendsRes.success) setDpdTrends(trendsRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading || !kpis) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Credit Risk Monitoring
            </h1>
            <p className="text-muted-foreground mt-1">Real-time portfolio analytics and risk insights</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Hero KPIs - Circular Gauges */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{(kpis.portfolio.totalExposure / 10000000).toFixed(1)}Cr
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.portfolio.activeLoans} Active Loans
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gross NPA Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleGauge
                value={kpis.npa.grossNPARate}
                min={0}
                max={10}
                unit="%"
                height={200}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">PAR-30 Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleGauge
                value={kpis.delinquency.par30Rate}
                min={0}
                max={20}
                unit="%"
                height={200}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-green-200 dark:border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collection Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleGauge
                value={kpis.collections.collectionEfficiency}
                min={70}
                max={100}
                unit="%"
                height={200}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="risks">Top Risks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Sector Exposure */}
              <Card>
                <CardHeader>
                  <CardTitle>Sector Exposure</CardTitle>
                  <CardDescription>Loan distribution across sectors</CardDescription>
                </CardHeader>
                <CardContent>
                  <ColumnChart
                    data={sectorData.map(s => ({
                      sector: s.sector,
                      exposure: parseFloat((s.totalExposure / 10000000).toFixed(2)),
                    }))}
                    categoryField="sector"
                    valueField="exposure"
                    height={300}
                    color="#3b82f6"
                  />
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Portfolio composition by risk level</CardDescription>
                </CardHeader>
                <CardContent>
                  {composition?.riskDistribution && (
                    <DonutChart
                      data={composition.riskDistribution}
                      height={300}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DPD Trends - Last 3 Months</CardTitle>
                <CardDescription>Average Days Past Due over time</CardDescription>
              </CardHeader>
              <CardContent>
                {dpdTrends?.overall && (
                  <TrendChart
                    data={dpdTrends.overall.map((d: any) => ({
                      month: d.month,
                      dpd: d.avg_dpd,
                    }))}
                    xField="month"
                    series={[
                      { name: 'Avg DPD', field: 'dpd', color: '#3b82f6' },
                    ]}
                    height={400}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 High-Risk Loans</CardTitle>
                <CardDescription>Loans requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Loan ID</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-right p-2">Amount</th>
                        <th className="text-center p-2">DPD</th>
                        <th className="text-center p-2">Risk</th>
                        <th className="text-left p-2">Sector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRisks.map((loan: any) => (
                        <tr key={loan.loanId} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-mono text-xs">{loan.loanId}</td>
                          <td className="p-2">{loan.customerName}</td>
                          <td className="p-2 text-right">₹{(loan.outstandingAmount / 100000).toFixed(2)}L</td>
                          <td className="p-2 text-center">
                            <Badge variant={loan.dpd > 30 ? 'destructive' : 'secondary'}>
                              {loan.dpd}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <Badge
                              variant={
                                loan.riskCategory === 'HIGH'
                                  ? 'destructive'
                                  : loan.riskCategory === 'MEDIUM'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {loan.riskScore}
                            </Badge>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{loan.sector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
