'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Input,
    Modal,
    Form,
    Select,
    Tag,
    message,
    Card,
    Row,
    Col,
    Statistic,
    Descriptions,
    Divider,
    Drawer,
} from 'antd';
import {
    ReloadOutlined,
    SearchOutlined,
    BulbOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { complaintsApi } from '@/lib/api';
import { useStatsDrawer } from '@/lib/stats-drawer-context';
import dayjs from 'dayjs';

const { Search } = Input;
const { TextArea } = Input;

interface Complaint extends Record<string, unknown> {
    id: number;
    client_id: number;
    client_name?: string;
    company_name?: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    assigned_to?: string;
    resolution?: string;
    admin_feedback?: string;
    created_at: string;
    updated_at: string;
}

export default function ComplaintsPage() {
    const { open: statsOpen, closeStats } = useStatsDrawer();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await complaintsApi.getAll();
            if (response.error) {
                message.error(response.error);
                return;
            }
            setComplaints(response.data || []);
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
            message.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleEdit = (record: Complaint) => {
        setEditingComplaint(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await complaintsApi.delete(id);
            if (response.error) {
                message.error(response.error);
                return;
            }
            message.success('Complaint deleted successfully');
            fetchComplaints();
        } catch (error) {
            message.error('Failed to delete complaint');
        }
    };

    const handleUpdate = async (values: any) => {
        if (!editingComplaint) return;
        try {
            const response = await complaintsApi.update(editingComplaint.id, values);
            if (response.error) {
                message.error(response.error);
                return;
            }
            message.success('Complaint updated successfully');
            setModalVisible(false);
            fetchComplaints();
        } catch (error) {
            message.error('Failed to update complaint');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'blue';
            case 'in_progress': return 'orange';
            case 'resolved': return 'green';
            case 'closed': return 'gray';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'blue';
            case 'low': return 'green';
            default: return 'default';
        }
    };

    const filteredComplaints = complaints.filter(c =>
        c.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.client_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchText.toLowerCase())
    );

    const kpis = {
        total: complaints.length,
        open: complaints.filter(c => c.status === 'open').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date: string) => dayjs(date).format('DD-MM-YYYY'),
            sorter: (a: Complaint, b: Complaint) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
        },
        {
            title: 'Client',
            key: 'client',
            width: 180,
            render: (_: any, record: Complaint) => (
                <div>
                    <div className="font-medium">{record.client_name}</div>
                    <div className="text-xs text-gray-500">{record.company_name}</div>
                </div>
            ),
        },
        {
            title: 'Complaint Details',
            key: 'details',
            render: (_: any, record: Complaint) => (
                <div>
                    <div className="font-medium">{record.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{record.description}</div>
                </div>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (cat: string) => <Tag>{cat.replace('_', ' ').toUpperCase()}</Tag>,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority: string) => (
                <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right' as const,
            render: (_: any, record: Complaint) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Manage
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Delete Complaint',
                                content: 'Are you sure you want to delete this complaint?',
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
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BulbOutlined /> Client Complaints (Problems)
                    </h1>
                    <p className="text-gray-500 mt-1">Review and resolve issues reported by clients</p>
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchComplaints}>
                    Refresh
                </Button>
            </div>

            {/* Stats Drawer */}
            <Drawer title="Complaint Statistics" placement="right" width={520} open={statsOpen} onClose={closeStats}>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic title="Total Complaints" value={kpis.total} prefix={<BulbOutlined className="text-blue-500" />} />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic title="Open" value={kpis.open} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic title="In Progress" value={kpis.inProgress} valueStyle={{ color: '#faad14' }} prefix={<SyncOutlined spin={kpis.inProgress > 0} />} />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card bordered={false} className="shadow-sm">
                            <Statistic title="Resolved" value={kpis.resolved} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                        </Card>
                    </Col>
                </Row>
            </Drawer>

            <div className="mb-4">
                <Search
                    placeholder="Search by title, client, or description..."
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 400 }}
                    prefix={<SearchOutlined />}
                />
            </div>

            <Table
                columns={columns}
                dataSource={filteredComplaints}
                rowKey="id"
                loading={loading}
                size="small"
                bordered
            />

            <Modal
                title="Manage Complaint"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                width={800}
                destroyOnClose
            >
                {editingComplaint && (
                    <div className="mb-6">
                        <Descriptions title="Complaint Details" bordered column={2}>
                            <Descriptions.Item label="Client">{editingComplaint.client_name}</Descriptions.Item>
                            <Descriptions.Item label="Company">{editingComplaint.company_name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Category">{editingComplaint.category.toUpperCase()}</Descriptions.Item>
                            <Descriptions.Item label="Date">{dayjs(editingComplaint.created_at).format('DD-MM-YYYY HH:mm')}</Descriptions.Item>
                            <Descriptions.Item label="Title" span={2}>{editingComplaint.title}</Descriptions.Item>
                            <Descriptions.Item label="Description" span={2}>{editingComplaint.description}</Descriptions.Item>
                        </Descriptions>

                        <Divider>Admin Action</Divider>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdate}
                        >
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                        <Select options={[
                                            { label: 'OPEN', value: 'open' },
                                            { label: 'IN PROGRESS', value: 'in_progress' },
                                            { label: 'RESOLVED', value: 'resolved' },
                                            { label: 'CLOSED', value: 'closed' },
                                        ]} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                                        <Select options={[
                                            { label: 'LOW', value: 'low' },
                                            { label: 'MEDIUM', value: 'medium' },
                                            { label: 'HIGH', value: 'high' },
                                            { label: 'URGENT', value: 'urgent' },
                                        ]} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="assigned_to" label="Assigned To">
                                        <Input placeholder="Assignee name" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="admin_feedback" label="Internal Admin Feedback (Not shown to client)">
                                <TextArea rows={3} placeholder="Add internal notes for admins..." />
                            </Form.Item>

                            <Form.Item name="resolution" label="Resolution/Feedback to Client">
                                <TextArea rows={3} placeholder="Explain how the issue was resolved or provide feedback to the client..." />
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    );
}
