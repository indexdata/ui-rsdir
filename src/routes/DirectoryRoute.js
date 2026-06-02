import React from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink, Redirect, Switch } from 'react-router-dom';
import { Route } from '@folio/stripes/core';
import EntriesRoute from './EntriesRoute';
import ViewEntryRoute from './ViewEntryRoute';
import EditEntryRoute from './EditEntryRoute';
import EditLMSConfigRoute from './EditLMSConfigRoute';
import EditEntryNetworksRoute from './EditEntryNetworksRoute';
import EditEntryTiersRoute from './EditEntryTiersRoute';
import EntryPointsRoute from './EntryPointsRoute';
import NetworksRoute from './NetworksRoute';
import EditNetworkRoute from './EditNetworkRoute';
import TiersRoute from './TiersRoute';

const tabBarStyle = {
  borderBottom: '1px solid #d8d8d8',
  display: 'flex',
  gap: '1rem',
  padding: '0 1rem',
};

const tabStyle = {
  color: 'inherit',
  display: 'block',
  padding: '0.75rem 0',
  textDecoration: 'none',
};

const activeTabStyle = {
  borderBottom: '3px solid #0066cc',
  fontWeight: '600',
};

const DirectoryRoute = ({ match: { path } }) => {
  return (
    <>
      <nav aria-label="Directory sections" style={tabBarStyle}>
        <NavLink
          activeStyle={activeTabStyle}
          isActive={(_match, location) => location.pathname.startsWith(`${path}/entries`)}
          style={tabStyle}
          to={`${path}/entries`}
        >
          <FormattedMessage id="ui-rsdir.tabs.entries" />
        </NavLink>
        <NavLink
          activeStyle={activeTabStyle}
          isActive={(_match, location) => location.pathname.startsWith(`${path}/networks`)}
          style={tabStyle}
          to={`${path}/networks`}
        >
          <FormattedMessage id="ui-rsdir.tabs.networks" />
        </NavLink>
        <NavLink
          activeStyle={activeTabStyle}
          isActive={(_match, location) => location.pathname.startsWith(`${path}/tiers`)}
          style={tabStyle}
          to={`${path}/tiers`}
        >
          <FormattedMessage id="ui-rsdir.tabs.tiers" />
        </NavLink>
      </nav>
      <Switch>
        <Redirect
          exact
          from={path}
          to={`${path}/entries`}
        />
        <Route path={`${path}/entries`} component={EntriesRoute}>
          <Route path={`${path}/entries/create`} component={EditEntryRoute} />
          <Route path={`${path}/entries/entry-points/:id`} component={EntryPointsRoute} />
          <Route path={`${path}/entries/view/:id`} component={ViewEntryRoute} />
          <Route path={`${path}/entries/edit/:id`} component={EditEntryRoute} />
          <Route path={`${path}/entries/lmsconfig/edit/:id`} component={EditLMSConfigRoute} />
          <Route path={`${path}/entries/networks/edit/:id`} component={EditEntryNetworksRoute} />
          <Route path={`${path}/entries/tiers/edit/:id`} component={EditEntryTiersRoute} />
        </Route>
        <Route path={`${path}/networks`} component={NetworksRoute}>
          <Route path={`${path}/networks/create`} component={EditNetworkRoute} />
          <Route path={`${path}/networks/edit/:id`} component={EditNetworkRoute} />
        </Route>
        <Route path={`${path}/tiers`} component={TiersRoute} />
      </Switch>
    </>
  );
};

export default DirectoryRoute;
