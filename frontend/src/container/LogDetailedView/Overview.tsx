import './Overview.styles.scss';

import MEditor, { EditorProps, Monaco } from '@monaco-editor/react';
import { Color } from '@signozhq/design-tokens';
import {
	Button,
	Collapse,
	Divider,
	Input,
	Switch,
	Tag,
	Typography,
} from 'antd';
import { AddToQueryHOCProps } from 'components/Logs/AddToQueryHOC';
import { useIsDarkMode } from 'hooks/useDarkMode';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ILog } from 'types/api/logs/log';

import { ActionItemProps } from './ActionItem';
import TableView from './TableView';
import { aggregateAttributesResourcesToString } from './utils';

interface OverviewProps {
	logData: ILog;
}

type Props = OverviewProps &
	Partial<Pick<ActionItemProps, 'onClickActionItem'>> &
	Pick<AddToQueryHOCProps, 'onAddToQuery'>;

function Overview({
	logData,
	onAddToQuery,
	onClickActionItem,
}: Props): JSX.Element {
	const [isWrapWord, setIsWrapWord] = useState<boolean>(false);
	const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
	const [isAttributesExpanded, setIsAttributesExpanded] = useState<boolean>(
		true,
	);
	const [fieldSearchInput, setFieldSearchInput] = useState<string>('');

	const logJsonData = useMemo(
		() => aggregateAttributesResourcesToString(logData),
		[logData],
	);

	const isDarkMode = useIsDarkMode();

	const options: EditorProps['options'] = {
		automaticLayout: true,
		readOnly: true,
		height: '40vh',
		wordWrap: 'on',
		minimap: {
			enabled: false,
		},
		fontWeight: 400,
		// fontFamily: 'SF Mono',
		fontFamily: 'Space Mono',
		fontSize: 13,
		lineHeight: '18px',
		colorDecorators: true,
		scrollBeyondLastLine: false,
		scrollbar: {
			vertical: 'hidden',
			horizontal: 'hidden',
		},
	};

	const handleWrapWord = (checked: boolean): void => {
		setIsWrapWord(checked);
	};

	function setEditorTheme(monaco: Monaco): void {
		monaco.editor.defineTheme('my-theme', {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'string.key.json', foreground: Color.BG_VANILLA_400 },
				{ token: 'string.value.json', foreground: Color.BG_ROBIN_400 },
			],
			colors: {
				'editor.background': Color.BG_INK_400,
			},
			// fontFamily: 'SF Mono',
			fontFamily: 'Space Mono',
			fontSize: 12,
			fontWeight: 'normal',
			lineHeight: 18,
			letterSpacing: -0.06,
		});
	}

	const handleSearchVisible = (): void => {
		setIsSearchVisible(!isSearchVisible);
	};

	const toogleAttributePanelOpenState = (): void => {
		setIsAttributesExpanded(!isAttributesExpanded);
	};

	return (
		<div className="overview-container">
			<Collapse
				defaultActiveKey={['1']}
				items={[
					{
						key: '1',
						label: (
							<Tag bordered={false}>
								<Typography.Text style={{ color: Color.BG_ROBIN_400 }}>
									body
								</Typography.Text>
							</Tag>
						),
						children: (
							<div className="logs-body-content">
								<MEditor
									value={isWrapWord ? JSON.stringify(logData) : logJsonData}
									language={isWrapWord ? 'placetext' : 'json'}
									options={options}
									onChange={(): void => {}}
									height="40vh"
									theme={isDarkMode ? 'my-theme' : 'light'}
									// eslint-disable-next-line react/jsx-no-bind
									beforeMount={setEditorTheme}
								/>
								<Divider
									style={{
										margin: 0,
										border: isDarkMode
											? `1px solid ${Color.BG_SLATE_500}`
											: `1px solid ${Color.BG_VANILLA_200}`,
									}}
								/>
								<div className="log-switch">
									<div className="wrap-word-switch">
										<Typography.Text>Wrap text</Typography.Text>
										<Switch checked={isWrapWord} onChange={handleWrapWord} size="small" />
									</div>
								</div>
							</div>
						),
						extra: <Tag className="tag">{isWrapWord ? 'Raw' : 'JSON'}</Tag>,
						className: 'collapse-content',
					},
				]}
			/>

			<Collapse
				className="attribute-table"
				defaultActiveKey={['1']}
				bordered={false}
				items={[
					{
						key: '1',
						label: (
							// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
							<div
								className="attribute-tab-header"
								onClick={toogleAttributePanelOpenState}
							>
								<Tag bordered={false}>
									<Typography.Text style={{ color: Color.BG_ROBIN_400 }}>
										Attributes
									</Typography.Text>
								</Tag>

								{isAttributesExpanded && (
									<Button
										className="action-btn"
										icon={<Search size={14} />}
										onClick={(e): void => {
											e.stopPropagation();
											handleSearchVisible();
										}}
									/>
								)}
							</div>
						),
						children: (
							<>
								{isSearchVisible && (
									<Input
										autoFocus
										placeholder="Search for a field..."
										className="search-input"
										value={fieldSearchInput}
										onChange={(e): void => setFieldSearchInput(e.target.value)}
									/>
								)}

								<TableView
									logData={logData}
									onAddToQuery={onAddToQuery}
									fieldSearchInput={fieldSearchInput}
									onClickActionItem={onClickActionItem}
								/>
							</>
						),
						className: 'collapse-content attribute-collapse',
					},
				]}
			/>
		</div>
	);
}

export default Overview;