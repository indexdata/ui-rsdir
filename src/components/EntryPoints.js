import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import {
  NavList,
  NavListItem,
  Pane,
} from '@folio/stripes/components';
import { useCloseDirect, useOkapiQuery } from '@projectreshare/stripes-reshare';
import ViewEntry from './ViewEntry';

const entryPath = id => `rsdir/entries/by-id/${id}`;

const EntryPoints = ({ id }) => {
  const intl = useIntl();
  const location = useLocation();
  const close = useCloseDirect(`/rsdir/entries${location.search}`);
  const entryQuery = useOkapiQuery(entryPath(id), {
    staleTime: 2 * 60 * 1000,
    cacheTime: 8 * 60 * 60 * 1000,
    keepPreviousData: true,
    enabled: !!id,
  });

  if (!entryQuery.isSuccess) {
    return null;
  }

  const entry = entryQuery.data;
  const title = intl.formatMessage({ id: 'ui-rsdir.entryPoints.title' }, { name: entry.name });
  const isConsortium = entry.type === 'Consortium';
  const tiersPath = isConsortium
    ? `/rsdir/entries/tiers/manage/${id}`
    : `/rsdir/entries/tiers/edit/${id}`;
  const networksPath = isConsortium
    ? `/rsdir/entries/networks/manage/${id}`
    : `/rsdir/entries/networks/edit/${id}`;

  return (
    <Pane
      defaultWidth="fill"
      dismissible
      onClose={close}
      paneTitle={title}
    >
      <ViewEntry entry={entry} isEmbedded />
      <NavList aria-label={title} striped>
        <NavListItem
          id="clickable-entry-point-edit"
          to={`/rsdir/entries/edit/${id}${location.search}`}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.edit" />
        </NavListItem>
        <NavListItem
          id="clickable-entry-point-lms-config"
          to={`/rsdir/entries/lmsconfig/edit/${id}${location.search}`}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.lmsConfig" />
        </NavListItem>
        <NavListItem
          id="clickable-entry-point-tiers"
          to={`${tiersPath}${location.search}`}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.tiers" />
        </NavListItem>
        <NavListItem
          id="clickable-entry-point-networks"
          to={`${networksPath}${location.search}`}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.networks" />
        </NavListItem>
      </NavList>
    </Pane>
  );
};

export default EntryPoints;
