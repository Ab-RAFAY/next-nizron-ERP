'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Space,
  Input,
  Drawer,
  App,
  Tag,
  Card,
  Row,
  Col,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { purchaseApi, vendorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { useStatsDrawer } from '@/lib/stats-drawer-context';

import PurchaseForm from './PurchaseForm';

const { Search } = Input;
const { Option } = Select;

interface Purchase extends Record<string, unknown> {
  id: number;
  purchase_order: string;
  vendor_id: number;
  vendor_name?: string;
  date: string;
  amount: number;
  status: string;
  description?: string;
}

interface Vendor {
  id: number;
  name: string;
  company_name?: string;
}

export default function PurchasesPage() {
  const { open: statsOpen, closeStats } = useStatsDrawer();
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check if user is admin (you can modify this logic based on your auth system)
  const isAdmin = user?.email?.includes('admin') || user?.email === 'admin@example.com';

  const fetchPurchases = async () => {
    setLoading(true);
    const response = await purchaseApi.getAll();
    setLoading(false);

    if (response.error) {
      message.error('Failed to fetch purchases: ' + response.error);
      return;
    }

    const purchaseData = (response.data as any)?.purchases || (response.data as any) || [];
    setPurchases(purchaseData);
    setFilteredPurchases(purchaseData);
  };

  const fetchVendors = async () => {
    const response = await vendorApi.getAll();
    if (!response.error) {
      const vendorData = (response.data as any)?.vendors || (response.data as any) || [];
      setVendors(vendorData);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchVendors();
  }, []);

  useEffect(() => {
    let filtered = purchases;

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(purchase =>
        purchase.purchase_order?.toLowerCase().includes(searchText.toLowerCase()) ||
        purchase.vendor_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        purchase.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        purchase.amount?.toString().includes(searchText)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.status === statusFilter);
    }

    setFilteredPurchases(filtered);
  }, [searchText, statusFilter, purchases]);

  const handleAddPurchase = () => {
    if (!isAdmin) {
      message.warning('Only administrators can add purchases');
      return;
    }
    setEditingPurchase(null);
    setDrawerVisible(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    if (!isAdmin) {
      message.warning('Only administrators can edit purchases');
      return;
    }
    setEditingPurchase(purchase);
    setDrawerVisible(true);
  };

  const handleDeletePurchase = async (purchase: Purchase) => {
    if (!isAdmin) {
      message.warning('Only administrators can delete purchases');
      return;
    }
    
    const response = await purchaseApi.delete(purchase.id);
    if (response.error) {
      message.error('Failed to delete purchase: ' + response.error);
      return;
    }
    message.success('Purchase deleted successfully');
    fetchPurchases();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!isAdmin) {
      message.warning('Only administrators can modify purchases');
      return;
    }

    const response = editingPurchase
      ? await purchaseApi.update(editingPurchase.id, values)
      : await purchaseApi.create(values);

    if (response.error) {
      message.error(`Failed to ${editingPurchase ? 'update' : 'create'} purchase: ` + response.error);
      return;
    }

    message.success(`Purchase ${editingPurchase ? 'updated' : 'created'} successfully`);
    setDrawerVisible(false);
    fetchPurchases();
  };

  const handleRowClick = (purchase: Purchase) => {
    router.push(`/dashboard/purchases/${purchase.id}`);
  };

  const columns = [
    {
      title: 'Purchase Order',
      dataIndex: 'purchase_order',
      key: 'purchase_order',
      width: 150,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `$${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        else if (status === 'approved') color = 'blue';
        
        return (
          <Tag color={color}>
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Purchase) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/purchases/${record.id}`);
            }}
          />
          {isAdmin && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPurchase(record);
                }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePurchase(record);
                }}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  // Calculate statistics for dashboard cards
  const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPurchases = filteredPurchases.filter(p => p.status === 'completed').length;
  const pendingPurchases = filteredPurchases.filter(p => p.status === 'pending').length;
  const totalPurchases = filteredPurchases.length;
  const approvedPurchases = filteredPurchases.filter(p => p.status === 'approved').length;
  const cancelledPurchases = filteredPurchases.filter(p => p.status === 'cancelled').length;

  // Vendor spending breakdown for chart
  const vendorSpendMap: Record<string, number> = {};
  filteredPurchases.forEach(p => {
    const vName = p.vendor_name || 'Unknown';
    vendorSpendMap[vName] = (vendorSpendMap[vName] || 0) + (p.amount || 0);
  });
  const topVendors = Object.entries(vendorSpendMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const vendorLabels = topVendors.map(([name]) => name);
  const vendorAmounts = topVendors.map(([, amount]) => amount);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#1f1f1f', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingOutlined /> Purchase Management
          </h1>
          {!isAdmin && (
            <p style={{ fontSize: 11, color: '#faad14', margin: '2px 0 0' }}>Read-only: only admins can create/edit/delete</p>
          )}
        </div>
        <Space size={6}>
          <Search
            placeholder="Search purchases..."
            allowClear
            size="small"
            style={{ width: 220 }}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            size="small"
            style={{ width: 110 }}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchPurchases} loading={loading}>Refresh</Button>
          {isAdmin && (
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddPurchase}>Add Purchase</Button>
          )}
        </Space>
      </div>

      <Drawer title="Purchase Statistics" placement="right" open={statsOpen} onClose={closeStats}>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={12}><Card size="small"><div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{totalPurchases}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Total</div></div></Card></Col>
          <Col xs={12}><Card size="small"><div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{completedPurchases}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Completed</div></div></Card></Col>
          <Col xs={12}><Card size="small"><div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}>{pendingPurchases}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Pending</div></div></Card></Col>
          <Col xs={12}><Card size="small"><div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>${totalAmount.toFixed(0)}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Total Value</div></div></Card></Col>
        </Row>
        <PieChart data={{ labels: ['Completed', 'Pending', 'Approved', 'Cancelled'], datasets: [{ label: 'Purchase Status', data: [completedPurchases, pendingPurchases, approvedPurchases, cancelledPurchases], backgroundColor: ['#52c41a', '#faad14', '#1677ff', '#ff4d4f'], borderColor: ['#fff'], borderWidth: 1 }] }} title="Status Breakdown" />
      </Drawer>

      <Table
        columns={columns}
        dataSource={filteredPurchases}
        rowKey="id"
        loading={loading}
        size="small"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          total: filteredPurchases.length,
          pageSize: 20,
          showSizeChanger: true,
          size: 'small',
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} purchases`,
        }}
        scroll={{ x: 900, y: 'calc(100vh - 220px)' }}
      />

      {isAdmin && (
        <Drawer
          title={editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
          size="large"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <PurchaseForm
            initialValues={editingPurchase}
            vendors={vendors.map(v => ({ id: v.id as number, name: v.name as string, company_name: v.company_name as string }))}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerVisible(false)}
          />
        </Drawer>
      )}
    </div>
  );
}