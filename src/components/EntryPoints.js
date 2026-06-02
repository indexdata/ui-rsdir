import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Button,
  Headline,
  KeyValue,
  Pane,
} from '@folio/stripes/components';
import { useCloseDirect, useOkapiQuery } from '@projectreshare/stripes-reshare';

const entryPath = id => `rsdir/entries/by-id/${id}`;

const EntryPoints = ({ id }) => {
  const history = useHistory();
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
  const navigateTo = path => {
    history.push(`${path}${location.search}`);
  };

  return (
    <Pane
      defaultWidth="fill"
      dismissible
      onClose={close}
      paneTitle={intl.formatMessage({ id: 'ui-rsdir.entryPoints.title' }, { name: entry.name })}
    >
      <Headline size="large" tag="h2">
        {entry.name}
      </Headline>
      <KeyValue
        label={<FormattedMessage id="ui-rsdir.entry.type" />}
        value={entry.type}
      />
      <div>
        <Button
          buttonStyle="primary"
          fullWidth
          id="clickable-entry-point-view"
          onClick={() => navigateTo(`/rsdir/entries/view/${id}`)}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.view" />
        </Button>
        <Button
          fullWidth
          id="clickable-entry-point-lms-config"
          onClick={() => navigateTo(`/rsdir/entries/lmsconfig/edit/${id}`)}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.lmsConfig" />
        </Button>
        <Button
          fullWidth
          id="clickable-entry-point-tiers"
          onClick={() => navigateTo(`/rsdir/entries/tiers/edit/${id}`)}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.tiers" />
        </Button>
        <Button
          fullWidth
          id="clickable-entry-point-networks"
          onClick={() => navigateTo(`/rsdir/entries/networks/edit/${id}`)}
        >
          <FormattedMessage id="ui-rsdir.entryPoints.networks" />
        </Button>
      </div>
    </Pane>
  );
};

export default EntryPoints;
