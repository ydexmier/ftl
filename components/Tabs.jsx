// https://mui.com/material-ui/api/tab/
import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function BasicTabs(props) {
    const { fixed = false } = props;
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    if (fixed) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}>
                    <Tabs value={value} onChange={handleChange} aria-label="fixed tabs">
                        {props.tabs.map((tab, index) => <Tab disabled={tab.disabled} label={tab.label} {...a11yProps(index)} />)}
                    </Tabs>
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {props.tabs.map(
                        (tab, index) =>
                            <CustomTabPanel value={value} index={index}>
                                {tab.component}
                            </CustomTabPanel>
                    )}
                </Box>
            </Box>
        );
    }
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs">
                    {tabs.map((tab, index) => (
                        <Tab
                            key={index}
                            disabled={tab.disabled}
                            label={tab.label}
                            {...a11yProps(index)}
                        />
                    ))}
                </Tabs>
            </Box>
            {tabs.map((tab, index) => (
                <CustomTabPanel key={index} value={value} index={index}>
                    {tab.component}
                </CustomTabPanel>
            ))}
        </Box>
    );
}