'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { rolesApi } from '@/lib/api';

const MODULES = [
  { label: 'Human Resources', value: 'hr' },
  { label: 'Fleet Management', value: 'fleet' },
  { label: 'Operations', value: 'operations' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Finance', value: 'finance' },
  { label: 'Administration', value: 'administration' },
  { label: 'Chat', value: 'chat' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    const response = await rolesApi.getAll();
    setLoading(false);
    if (response.error) {
      message.error(response.error);
      return;
    }
    setRoles(response.data || []);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      permissions: record.permissions || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    const response = await rolesApi.remove(id);
    if (response.error) {
      message.error(response.error);
      return;
    }
    message.success('Role deleted successfully');
    fetchRoles();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = editingRole
        ? await rolesApi.update(editingRole.id, values)
        : await rolesApi.create(values);

      if (response.error) {
        message.error(response.error);
        return;
      }

      message.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {(permissions || []).map((p) => (
            <span key={p} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs border border-blue-100">
              {MODULES.find(m => m.value === p)?.label || p}
            </span>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Are you sure you want to delete this role?',
                content: 'This action cannot be undone and may fail if employees are assigned to this role.',
                onOk: () => handleDelete(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions</h1>
          <p className="text-gray-500 mt-1">Manage user roles and module access</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
          size="large"
        >
          Create Role
        </Button>
      </div>

      <Card bordered={false} className="shadow-sm">
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="e.g. HR Manager, Inventory Clerk" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter role description" rows={3} />
          </Form.Item>
          <Form.Item name="permissions" label="Module Permissions">
            <Checkbox.Group className="w-full">
              <Row>
                {MODULES.map((m) => (
                  <Col span={12} key={m.value} className="mb-2">
                    <Checkbox value={m.value}>{m.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
