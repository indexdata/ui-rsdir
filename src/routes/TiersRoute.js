import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import queryString from 'query-string';

import { useOkapiKy } from '@folio/stripes/core';
import {
  Button,
  MCLPagingTypes,
  MultiColumnList,
  Pane,
  PaneMenu,
  Paneset,
} from '@folio/stripes/components';
import { SearchAndSortQuery, makeQueryFunction } from '@folio/stripes/smart-components';

import SearchAndFilter from '../components/SearchAndFilter';

const tiersPath = 'rsdir/tiers';
const PER_PAGE = 100;

const normalizeList = data => {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.items || [];
};

const getTotalCount = data => {
  if (data?.about?.count !== undefined) {
    return data.about.count;
  }

  return normalizeList(data).length;
};

const TiersRoute = ({ children }) => {
  const ky = useOkapiKy();
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const match = useRouteMatch();
  const [offset, setOffset] = useState(0);

  const urlParams = queryString.parse(location.search);
  const queryParams = {
    query: urlParams.query || '',
    qindex: urlParams.qindex || '',
    filters: '',
    sort: ''
  };
  const queryTemplates = {
    // When qindex is empty string (All fields)
    '': '(name="*%{query.query}*" or description="*%{query.query}*")',
    'name': 'name="*%{query.query}*"',
  };
  const selectedTemplate = queryTemplates[queryParams.qindex] || queryTemplates[''];
  const getCQL = makeQueryFunction(
    'cql.allRecords=1',
    selectedTemplate,
    {},
    [],
    0,
  );
  const cql = getCQL(queryParams, {}, { query: queryParams }, console);

  useEffect(() => {
    setOffset(0);
  }, [cql]);

  const tiersQuery = useQuery({
    queryKey: [tiersPath, cql, offset, PER_PAGE],
    queryFn: () => {
      const params = new URLSearchParams();

      if (cql) {
        params.append('q', cql);
      }

      params.append('limit', PER_PAGE);
      params.append('offset', offset);

      return ky(`${tiersPath}?${params.toString()}`).json();
    },
    useErrorBoundary: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const tiers = useMemo(() => normalizeList(tiersQuery.data), [tiersQuery.data]);
  const sparseTiers = (new Array(offset)).concat(tiers);
  const totalCount = getTotalCount(tiersQuery.data);

  const fetchMore = (_askAmount, index) => {
    setOffset(index);
  };

  const handleNew = () => {
    history.push(`${match.url}/create${location.search}`);
  };

  const resultsFormatter = {
    name: tier => tier.name,
  };

  if (!tiersQuery.isSuccess) {
    return null;
  }

  return (
    <SearchAndSortQuery
      initialSearchState={{ query: '', qindex: 'name' }}
    >
      {({
        searchValue,
        getSearchHandlers,
        onSubmitSearch,
        resetAll,
        searchChanged,
      }) => (
        <Paneset>
          <Pane
            defaultWidth="20%"
            paneTitle={<FormattedMessage id="stripes-smart-components.searchAndFilter" />}
          >
            <form onSubmit={onSubmitSearch}>
              <SearchAndFilter
                resetAll={resetAll}
                searchChanged={searchChanged}
                searchHandlers={getSearchHandlers()}
                searchableIndexes={[{ label: 'name', value: 'name' }]}
                searchValue={searchValue}
              />
            </form>
          </Pane>
          <Pane
            defaultWidth="fill"
            lastMenu={
              <PaneMenu>
                <Button
                  buttonStyle="primary paneHeaderNewButton"
                  id="clickable-new-tier"
                  marginBottom0
                  onClick={handleNew}
                >
                  <FormattedMessage id="ui-rsdir.new" />
                </Button>
              </PaneMenu>
            }
            noOverflow
            padContent={false}
            paneTitle={intl.formatMessage({ id: 'ui-rsdir.tiers.resultsCount' }, { count: totalCount })}
          >
            <MultiColumnList
              autosize
              columnMapping={{
                name: intl.formatMessage({ id: 'ui-rsdir.tier.name' }),
              }}
              contentData={sparseTiers}
              formatter={resultsFormatter}
              id="tiers-list"
              isEmptyMessage={intl.formatMessage({ id: 'stripes-smart-components.sas.noResults.noTerms' })}
              loading={tiersQuery.isFetching}
              onNeedMoreData={fetchMore}
              onRowClick={(_e, rowData) => history.push(`${match.url}/edit/${rowData.id}${location.search}`)}
              pageAmount={PER_PAGE}
              pagingType={MCLPagingTypes.PREV_NEXT}
              totalCount={totalCount}
              visibleColumns={['name']}
            />
          </Pane>
          {children}
        </Paneset>
      )}
    </SearchAndSortQuery>
  );
};

export default TiersRoute;
