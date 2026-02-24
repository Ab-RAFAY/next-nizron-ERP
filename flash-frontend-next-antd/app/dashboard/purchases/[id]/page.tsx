'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Space, Table, Drawer, Form, Input,
  App, Popconfirm, Tag, Spin, Tabs, Row, Col, DatePicker, InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  ShoppingOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined,
  CalendarOutlined, DollarOutlined, FileTextOutlined, PrinterOutlined,
} from '@ant-design/icons';
import { purchaseApi, vendorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PurchaseForm from '../PurchaseForm';
import dayjs from 'dayjs';

interface Vendor {
  id: number;
  name: string;
  company_name?: string;
}

const { TextArea } = Input;
const { TabPane } = Tabs;

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <div className="field mb-4">
    <div className="field-label text-gray-600 font-medium"><strong>{label}:</strong></div>
    <div className="field-value text-gray-900 mt-1">{String(value || '-')}</div>
  </div>
);

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const purchaseId = parseInt(params.id as string);

  const [purchase, setPurchase] = useState<Record<string, unknown> | null>(null);
  const [vendor, setVendor] = useState<Record<string, unknown> | null>(null);
  const [vendors, setVendors] = useState<Array<Record<string, unknown>>>([]);
  const [purchaseItems, setPurchaseItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [itemDrawerVisible, setItemDrawerVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [itemForm] = Form.useForm();

  // Check if user is admin (you can modify this logic based on your auth system)
  const isAdmin = user?.email?.includes('admin') || user?.email === 'admin@example.com';

  const fetchPurchase = async () => {
    setLoading(true);
    const response = await purchaseApi.getOne(purchaseId);
    setLoading(false);
    if (response.error) {
      message.error(response.error);
      return;
    }
    const purchaseData = (response.data as any)?.purchase || (response.data as any) || null;
    setPurchase(purchaseData);

    // Fetch vendor details if purchase has vendor_id
    if (purchaseData?.vendor_id) {
      const vendorResponse = await vendorApi.getOne(purchaseData.vendor_id);
      if (!vendorResponse.error) {
        setVendor((vendorResponse.data as any)?.vendor || (vendorResponse.data as any) || null);
      }
    }
  };

  const fetchVendors = async () => {
    const response = await vendorApi.getAll();
    if (!response.error) {
      setVendors((response.data as any)?.vendors || (response.data as any) || []);
    }
  };

  const fetchPurchaseItems = async () => {
    const response = await purchaseApi.getItems(purchaseId);
    if (!response.error) {
      setPurchaseItems((response.data as any)?.items || (response.data as any) || []);
    }
  };

  useEffect(() => {
    fetchPurchase();
    fetchVendors();
    fetchPurchaseItems();
  }, [purchaseId]);

  const handleEditPurchase = async (values: Record<string, unknown>) => {
    if (!isAdmin) {
      message.warning('Only administrators can edit purchases');
      return;
    }

    const response = await purchaseApi.update(purchaseId, values);
    if (response.error) {
      message.error('Failed to update purchase: ' + response.error);
      return;
    }
    message.success('Purchase updated successfully');
    setEditDrawerVisible(false);
    fetchPurchase();
  };

  const handleDeletePurchase = async () => {
    if (!isAdmin) {
      message.warning('Only administrators can delete purchases');
      return;
    }

    const response = await purchaseApi.delete(purchaseId);
    if (response.error) {
      message.error('Failed to delete purchase: ' + response.error);
      return;
    }
    message.success('Purchase deleted successfully');
    router.push('/dashboard/purchases');
  };

  // Purchase Item management functions
  const handleAddItem = () => {
    if (!isAdmin) {
      message.warning('Only administrators can add items');
      return;
    }
    setEditingItem(null);
    itemForm.resetFields();
    setItemDrawerVisible(true);
  };

  const handleEditItem = (item: Record<string, unknown>) => {
    if (!isAdmin) {
      message.warning('Only administrators can edit items');
      return;
    }
    setEditingItem(item);
    itemForm.setFieldsValue(item);
    setItemDrawerVisible(true);
  };

  const handleItemSubmit = async (values: Record<string, unknown>) => {
    if (!isAdmin) {
      message.warning('Only administrators can modify items');
      return;
    }

    const response = editingItem
      ? await purchaseApi.updateItem(purchaseId, editingItem.id as number, values)
      : await purchaseApi.createItem(purchaseId, values);

    if (response.error) {
      message.error(`Failed to ${editingItem ? 'update' : 'create'} item: ` + response.error);
      return;
    }
    message.success(`Item ${editingItem ? 'updated' : 'created'} successfully`);
    setItemDrawerVisible(false);
    fetchPurchaseItems();
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!isAdmin) {
      message.warning('Only administrators can delete items');
      return;
    }

    const response = await purchaseApi.deleteItem(purchaseId, itemId);
    if (response.error) {
      message.error('Failed to delete item: ' + response.error);
      return;
    }
    message.success('Item deleted successfully');
    fetchPurchaseItems();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>Purchase not found</h2>
          <Button onClick={() => router.push('/dashboard/purchases')}>
            Back to Purchases
          </Button>
        </div>
      </div>
    );
  }

  const itemColumns = [
    { title: 'Item Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price',
      render: (price: number) => `$${price?.toFixed(2) || '0.00'}` },
    { title: 'Total', key: 'total',
      render: (_: unknown, record: any) => `$${((record.quantity || 0) * (record.unit_price || 0)).toFixed(2)}` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          {isAdmin ? (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditItem(record)}
              />
              <Popconfirm
                title="Are you sure you want to delete this item?"
                onConfirm={() => handleDeleteItem(record.id as number)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          ) : (
            <span className="text-gray-400">Read Only</span>
          )}
        </Space>
      ),
    },
  ];

  const totalItems = purchaseItems.reduce((sum, item: any) => 
    sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Space className="mb-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
          >
            Back
          </Button>
        </Space>

        {/* Permission Notice */}
        {!isAdmin && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You have read-only access to this purchase.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <ShoppingOutlined className="mr-2" />
            {String(purchase.purchase_order)}
          </h1>
          <Space>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            {isAdmin && (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditDrawerVisible(true)}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Are you sure you want to delete this purchase?"
                  onConfirm={handleDeletePurchase}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </div>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Purchase Information" className="mb-4">
                <Field label="Purchase Order" value={purchase.purchase_order} />
                <Field label="Date" value={
                  purchase.date ? new Date(purchase.date as string).toLocaleDateString() : '-'
                } />
                <Field label="Category" value={purchase.category} />
                <Field label="Priority" value={purchase.priority} />
                <Field label="Status" value={
                  <Tag color={
                    purchase.status === 'completed' ? 'green' :
                    purchase.status === 'approved' ? 'blue' :
                    purchase.status === 'pending' ? 'orange' : 'red'
                  }>
                    {String(purchase.status).toUpperCase()}
                  </Tag>
                } />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Financial Information" className="mb-4">
                <Field label="Total Amount" value={`$${(purchase.amount as number)?.toFixed(2) || '0.00'}`} />
                <Field label="Payment Terms" value={purchase.payment_terms} />
                <Field label="Reference Number" value={purchase.reference_number} />
                <Field label="Expected Delivery" value={
                  purchase.delivery_date ? new Date(purchase.delivery_date as string).toLocaleDateString() : '-'
                } />
              </Card>
            </Col>
          </Row>

          {vendor && (
            <Card title="Vendor Information" className="mb-4">
              <Row gutter={24}>
                <Col span={12}>
                  <Field label="Vendor Name" value={vendor.name} />
                  <Field label="Company" value={vendor.company_name} />
                </Col>
                <Col span={12}>
                  <Field label="Email" value={
                    vendor.email ? (
                      <a href={`mailto:${vendor.email}`} className="text-blue-600">
                        <MailOutlined className="mr-1" />
                        {String(vendor.email)}
                      </a>
                    ) : '-'
                  } />
                  <Field label="Phone" value={
                    vendor.phone ? (
                      <span>
                        <PhoneOutlined className="mr-1" />
                        {String(vendor.phone)}
                      </span>
                    ) : '-'
                  } />
                </Col>
              </Row>
            </Card>
          )}

          {String(purchase.delivery_address) && (
            <Card title="Delivery Information" className="mb-4">
              <Field label="Delivery Address" value={
                <span>
                  <EnvironmentOutlined className="mr-1" />
                  {String(purchase.delivery_address)}
                </span>
              } />
            </Card>
          )}

          {String(purchase.description) && (
            <Card title="Description" className="mb-4">
              <p>{String(purchase.description)}</p>
            </Card>
          )}

          {String(purchase.notes) && (
            <Card title="Internal Notes" className="mb-4">
              <p>{String(purchase.notes)}</p>
            </Card>
          )}
        </TabPane>

        <TabPane tab="Items" key="items">
          <div className="mb-4 flex justify-between items-center">
            {isAdmin ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
              >
                Add Item
              </Button>
            ) : (
              <div></div>
            )}
            <div className="text-lg font-semibold">
              Total: ${totalItems.toFixed(2)}
            </div>
          </div>
          <Table
            columns={itemColumns}
            dataSource={purchaseItems}
            rowKey="id"
            pagination={false}
          />
        </TabPane>
      </Tabs>

      {/* Edit Purchase Drawer - Only for Admin */}
      {isAdmin && (
        <Drawer
          title="Edit Purchase"
          size="large"
          onClose={() => setEditDrawerVisible(false)}
          open={editDrawerVisible}
        >
          <PurchaseForm
            initialValues={purchase}
            vendors={vendors.map(v => ({ id: v.id as number, name: v.name as string, company_name: v.company_name as string }))}
            onSubmit={handleEditPurchase}
            onCancel={() => setEditDrawerVisible(false)}
          />
        </Drawer>
      )}

      {/* Item Form Drawer - Only for Admin */}
      {isAdmin && (
        <Drawer
          title={editingItem ? 'Edit Item' : 'Add New Item'}
          size="default"
          onClose={() => setItemDrawerVisible(false)}
          open={itemDrawerVisible}
        >
          <Form
            form={itemForm}
            layout="vertical"
            onFinish={handleItemSubmit}
          >
            <Form.Item
              name="name"
              label="Item Name"
              rules={[{ required: true, message: 'Please enter item name' }]}
            >
              <Input placeholder="Enter item name" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={3} placeholder="Enter item description" />
            </Form.Item>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter quantity"
                min={0}
                step={1}
              />
            </Form.Item>
            <Form.Item
              name="unit_price"
              label="Unit Price"
              rules={[{ required: true, message: 'Please enter unit price' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter unit price"
                prefix="$"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>
            <Form.Item
              name="notes"
              label="Notes"
            >
              <TextArea rows={2} placeholder="Enter any additional notes" />
            </Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setItemDrawerVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </Form>
        </Drawer>
      )}
    </div>
  );
}