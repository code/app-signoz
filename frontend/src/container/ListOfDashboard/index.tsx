import { PlusOutlined } from '@ant-design/icons';
import {
	Card,
	Dropdown,
	MenuProps,
	Row,
	TableColumnProps,
	Typography,
} from 'antd';
import { ItemType } from 'antd/es/menu/hooks/useItems';
import createDashboard from 'api/dashboard/create';
import getAll from 'api/dashboard/getAll';
import { AxiosError } from 'axios';
import { ResizeTable } from 'components/ResizeTable';
import TextToolTip from 'components/TextToolTip';
import ROUTES from 'constants/routes';
import SearchFilter from 'container/ListOfDashboard/SearchFilter';
import useComponentPermission from 'hooks/useComponentPermission';
import history from 'lib/history';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { generatePath } from 'react-router-dom';
import { AppState } from 'store/reducers';
import { Dashboard } from 'types/api/dashboard/getAll';
import AppReducer from 'types/reducer/app';

import ImportJSON from './ImportJSON';
import { ButtonContainer, NewDashboardButton, TableContainer } from './styles';
import Createdby from './TableComponents/CreatedBy';
import DateComponent from './TableComponents/Date';
import DeleteButton from './TableComponents/DeleteButton';
import Name from './TableComponents/Name';
import Tags from './TableComponents/Tags';

function ListOfAllDashboard(): JSX.Element {
	const { user } = useSelector<AppState, AppReducer>((state) => state.app);

	const { data: getAllDashboardData, isLoading } = useQuery(
		['getAllDashboards', user?.userId],
		{
			queryFn: getAll,
		},
	);

	const dashboards = useMemo(() => getAllDashboardData?.payload || [], [
		getAllDashboardData,
	]);

	console.log('dashboards', dashboards);

	const { role } = useSelector<AppState, AppReducer>((state) => state.app);

	const [action, createNewDashboard, newDashboard] = useComponentPermission(
		['action', 'create_new_dashboards', 'new_dashboard'],
		role,
	);

	const { t } = useTranslation('dashboard');

	const [
		isImportJSONModalVisible,
		setIsImportJSONModalVisible,
	] = useState<boolean>(false);

	const [uploadedGrafana, setUploadedGrafana] = useState<boolean>(false);

	const [filteredDashboards, setFilteredDashboards] = useState<Dashboard[]>(
		dashboards || [],
	);

	useEffect(() => {
		if (dashboards) setFilteredDashboards(dashboards);
	}, [dashboards]);

	const [newDashboardState, setNewDashboardState] = useState({
		loading: false,
		error: false,
		errorMessage: '',
	});

	const columns: TableColumnProps<Data>[] = [
		{
			title: 'Name',
			dataIndex: 'name',
			width: 100,
			render: Name,
		},
		{
			title: 'Description',
			width: 100,
			dataIndex: 'description',
		},
		{
			title: 'Tags (can be multiple)',
			dataIndex: 'tags',
			width: 80,
			render: Tags,
		},
		{
			title: 'Created At',
			dataIndex: 'createdBy',
			width: 80,
			sorter: (a: Data, b: Data): number => {
				const prev = new Date(a.createdBy).getTime();
				const next = new Date(b.createdBy).getTime();

				return prev - next;
			},
			render: Createdby,
		},
		{
			title: 'Last Updated Time',
			width: 90,
			dataIndex: 'lastUpdatedTime',
			sorter: (a: Data, b: Data): number => {
				const prev = new Date(a.lastUpdatedTime).getTime();
				const next = new Date(b.lastUpdatedTime).getTime();

				return prev - next;
			},
			render: DateComponent,
		},
	];

	if (action) {
		columns.push({
			title: 'Action',
			dataIndex: '',
			key: 'x',
			width: 40,
			render: DeleteButton,
		});
	}

	const data: Data[] = filteredDashboards.map((e) => ({
		createdBy: e.created_at,
		description: e.data.description || '',
		id: e.uuid,
		lastUpdatedTime: e.updated_at,
		name: e.data.title,
		tags: e.data.tags || [],
		key: e.uuid,
	}));

	const onNewDashboardHandler = useCallback(async () => {
		try {
			setNewDashboardState({
				...newDashboardState,
				loading: true,
			});
			const response = await createDashboard({
				title: t('new_dashboard_title', {
					ns: 'dashboard',
				}),
				uploadedGrafana: false,
			});

			if (response.statusCode === 200) {
				history.push(
					generatePath(ROUTES.DASHBOARD, {
						dashboardId: response.payload.uuid,
					}),
				);
			} else {
				setNewDashboardState({
					...newDashboardState,
					loading: false,
					error: true,
					errorMessage: response.error || 'Something went wrong',
				});
			}
		} catch (error) {
			setNewDashboardState({
				...newDashboardState,
				error: true,
				errorMessage: (error as AxiosError).toString() || 'Something went Wrong',
			});
		}
	}, [newDashboardState, t]);

	const getText = useCallback(() => {
		if (!newDashboardState.error && !newDashboardState.loading) {
			return 'New Dashboard';
		}

		if (newDashboardState.loading) {
			return 'Loading';
		}

		return newDashboardState.errorMessage;
	}, [
		newDashboardState.error,
		newDashboardState.errorMessage,
		newDashboardState.loading,
	]);

	const onModalHandler = (uploadedGrafana: boolean): void => {
		setIsImportJSONModalVisible((state) => !state);
		setUploadedGrafana(uploadedGrafana);
	};

	const getMenuItems = useCallback(() => {
		const menuItems: ItemType[] = [];
		if (createNewDashboard) {
			menuItems.push({
				key: t('create_dashboard').toString(),
				label: t('create_dashboard'),
				disabled: isLoading,
				onClick: onNewDashboardHandler,
			});
		}

		menuItems.push({
			key: t('import_json').toString(),
			label: t('import_json'),
			onClick: (): void => onModalHandler(false),
		});

		menuItems.push({
			key: t('import_grafana_json').toString(),
			label: t('import_grafana_json'),
			onClick: (): void => onModalHandler(true),
		});

		return menuItems;
	}, [createNewDashboard, isLoading, onNewDashboardHandler, t]);

	const menu: MenuProps = useMemo(
		() => ({
			items: getMenuItems(),
		}),
		[getMenuItems],
	);

	const GetHeader = useMemo(
		() => (
			<Row justify="space-between">
				<Typography>Dashboard List</Typography>

				<ButtonContainer>
					<TextToolTip
						{...{
							text: `More details on how to create dashboards`,
							url: 'https://signoz.io/docs/userguide/dashboards',
						}}
					/>
					{newDashboard && (
						<Dropdown trigger={['click']} menu={menu}>
							<NewDashboardButton
								icon={<PlusOutlined />}
								type="primary"
								loading={newDashboardState.loading}
								danger={newDashboardState.error}
							>
								{getText()}
							</NewDashboardButton>
						</Dropdown>
					)}
				</ButtonContainer>
			</Row>
		),
		[
			getText,
			newDashboard,
			newDashboardState.error,
			newDashboardState.loading,
			menu,
		],
	);

	return (
		<Card>
			{GetHeader}

			<SearchFilter
				searchData={dashboards}
				filterDashboards={setFilteredDashboards}
			/>

			<TableContainer>
				<ImportJSON
					isImportJSONModalVisible={isImportJSONModalVisible}
					uploadedGrafana={uploadedGrafana}
					onModalHandler={(): void => onModalHandler(false)}
				/>
				<ResizeTable
					columns={columns}
					pagination={{
						pageSize: 9,
						defaultPageSize: 9,
					}}
					showHeader
					bordered
					sticky
					loading={isLoading}
					dataSource={data}
					showSorterTooltip
				/>
			</TableContainer>
		</Card>
	);
}

export interface Data {
	key: React.Key;
	name: string;
	description: string;
	tags: string[];
	createdBy: string;
	lastUpdatedTime: string;
	id: string;
}

export default ListOfAllDashboard;
