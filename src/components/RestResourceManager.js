import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Field, Form } from 'react-final-form';
import { Prompt, matchPath, useHistory, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { CalloutContext, useOkapiKy } from '@folio/stripes/core';
import {
  Button,
  Checkbox,
  Col,
  KeyValue,
  MCLPagingTypes,
  Modal,
  MultiColumnList,
  Pane,
  PaneFooter,
  PaneMenu,
  Paneset,
  Row,
  TextField,
} from '@folio/stripes/components';
import { useOkapiQuery } from '@projectreshare/stripes-reshare';

const CREATE = 'create';
const EDIT = 'edit';
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

const parseJsonResponse = response => response.text()
  .then(text => (text ? JSON.parse(text) : undefined));

const resourcePath = (endpoint, id) => `${endpoint}/${id}`;

const normalizeType = fieldType => fieldType?.toLowerCase?.() || 'string';

const isEmptyRequiredValue = value => value === undefined || value === null || value === '';

const requiredResourceValue = value => (
  isEmptyRequiredValue(value)
    ? <FormattedMessage id="stripes-core.label.missingRequiredField" />
    : undefined
);

const valueForSubmit = (value, fieldType) => {
  if (value === '') {
    return null;
  }

  if (normalizeType(fieldType) === 'numeric') {
    return value === null || value === undefined ? value : Number(value);
  }

  return value;
};

const valuesForSubmit = (values, fields) => fields.reduce((acc, field) => {
  if (field.name !== 'id') {
    acc[field.name] = valueForSubmit(values[field.name], field.fieldType);
  }

  return acc;
}, {});

const modifiedValuesForSubmit = (values, fields, dirtyFields) => fields.reduce((acc, field) => {
  if (field.name !== 'id' && dirtyFields[field.name]) {
    acc[field.name] = valueForSubmit(values[field.name], field.fieldType);
  }

  return acc;
}, {});

const renderField = field => {
  const type = normalizeType(field.fieldType);
  const commonProps = {
    label: field.displayName,
    required: field.required,
    validate: field.required ? requiredResourceValue : undefined,
  };

  if (type === 'boolean') {
    return (
      <Field
        {...commonProps}
        component={Checkbox}
        name={field.name}
        type="checkbox"
      />
    );
  }

  return (
    <Field
      {...commonProps}
      component={TextField}
      name={field.name}
      type={type === 'numeric' ? 'number' : 'text'}
    />
  );
};

const RestResourceManager = ({
  endpoint,
  fields,
  match,
  resourceName,
  singularResourceName,
}) => {
  const callout = useContext(CalloutContext);
  const history = useHistory();
  const intl = useIntl();
  const ky = useOkapiKy();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const resourceId = endpoint.replace(/[^\w-]+/g, '-');

  const listingField = useMemo(
    () => fields.find(field => field.listingField) || fields[0],
    [fields],
  );
  const editableFields = useMemo(
    () => fields.filter(field => field.name !== 'id'),
    [fields],
  );
  const createMatch = matchPath(location.pathname, {
    exact: true,
    path: `${match.path}/create`,
  });
  const editMatch = matchPath(location.pathname, {
    exact: true,
    path: `${match.path}/edit/:id`,
  });
  const id = editMatch?.params?.id;
  const op = createMatch ? CREATE : id ? EDIT : null;
  const itemPath = resourcePath(endpoint, id);
  const displayName = singularResourceName || resourceName;

  useEffect(() => {
    setOffset(0);
  }, [endpoint]);

  const listQuery = useQuery({
    queryKey: [endpoint, offset, PER_PAGE],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('limit', PER_PAGE);
      params.append('offset', offset);

      return ky(`${endpoint}?${params.toString()}`).json();
    },
    useErrorBoundary: true,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const itemQuery = useOkapiQuery(itemPath, {
    staleTime: 2 * 60 * 1000,
    enabled: op === EDIT && !!id,
  });

  const records = useMemo(() => normalizeList(listQuery.data), [listQuery.data]);
  const sparseRecords = (new Array(offset)).concat(records);
  const totalCount = getTotalCount(listQuery.data);

  const close = () => {
    history.push(`${match.url}${location.search}`);
  };

  const invalidateResourceQueries = async () => {
    await queryClient.invalidateQueries(endpoint);
    await queryClient.invalidateQueries([endpoint]);
    if (id) {
      await queryClient.invalidateQueries(itemPath);
    }
  };

  const sendErrorCallout = (labelId, err) => {
    callout.sendCallout({
      type: 'error',
      message: (
        <KeyValue
          label={<FormattedMessage id={labelId} values={{ resourceName: displayName }} />}
          value={err.response?.statusText || err.message}
        />
      ),
    });
  };

  const creator = useMutation({
    mutationFn: newRecord => ky
      .post(endpoint, { json: newRecord })
      .then(parseJsonResponse),
    onSuccess: async createdRecord => {
      await invalidateResourceQueries();
      callout.sendCallout({
        type: 'success',
        message: <FormattedMessage id="ui-rsdir.resource.create.success" values={{ resourceName: displayName }} />,
      });

      if (createdRecord?.id) {
        history.push(`${match.url}/edit/${createdRecord.id}${location.search}`);
      } else {
        close();
      }
    },
    onError: err => sendErrorCallout('ui-rsdir.resource.create.error', err),
  });

  const updater = useMutation({
    mutationFn: modifiedFields => ky.patch(resourcePath(endpoint, id), { json: modifiedFields }),
    onSuccess: async () => {
      await invalidateResourceQueries();
      callout.sendCallout({
        type: 'success',
        message: <FormattedMessage id="ui-rsdir.resource.edit.success" values={{ resourceName: displayName }} />,
      });
      close();
    },
    onError: err => sendErrorCallout('ui-rsdir.resource.edit.error', err),
  });

  const deleter = useMutation({
    mutationFn: () => ky.delete(resourcePath(endpoint, id)),
    onSuccess: async () => {
      await invalidateResourceQueries();
      callout.sendCallout({
        type: 'success',
        message: <FormattedMessage id="ui-rsdir.resource.delete.success" values={{ resourceName: displayName }} />,
      });
      setDeleteModalOpen(false);
      close();
    },
    onError: err => sendErrorCallout('ui-rsdir.resource.delete.error', err),
  });

  const fetchMore = (_askAmount, index) => {
    setOffset(index);
  };

  const submit = (values, form) => {
    if (op === CREATE) {
      return creator.mutateAsync(valuesForSubmit(values, editableFields));
    }

    return updater.mutateAsync(modifiedValuesForSubmit(
      values,
      editableFields,
      form.getState().dirtyFields,
    ));
  };

  const getFooter = (handleSubmit, pristine, submitting, invalid) => {
    const cancelButton = (
      <Button
        buttonStyle="default mega"
        id={`clickable-cancel-${resourceId}`}
        marginBottom0
        onClick={close}
      >
        <FormattedMessage id="ui-rsdir.cancel" />
      </Button>
    );

    const deleteButton = op === EDIT ? (
      <Button
        buttonStyle="danger mega"
        disabled={deleter.isLoading || submitting}
        id={`clickable-delete-${resourceId}`}
        marginBottom0
        onClick={() => setDeleteModalOpen(true)}
      >
        <FormattedMessage id="ui-rsdir.delete" />
      </Button>
    ) : null;

    const saveButton = (
      <Button
        buttonStyle="primary mega"
        disabled={pristine || submitting || invalid}
        id={`clickable-save-${resourceId}`}
        marginBottom0
        onClick={handleSubmit}
        type="submit"
      >
        <FormattedMessage id={op === CREATE ? 'ui-rsdir.create' : 'ui-rsdir.edit.submit'} />
      </Button>
    );

    return (
      <PaneFooter
        renderStart={(
          <>
            {cancelButton}
            {deleteButton}
          </>
        )}
        renderEnd={saveButton}
      />
    );
  };

  const paneTitle = initialValues => {
    if (op === CREATE) {
      return <FormattedMessage id="ui-rsdir.resource.create" values={{ resourceName: displayName }} />;
    }

    return (
      <FormattedMessage
        id="ui-rsdir.resource.edit"
        values={{
          name: initialValues?.[listingField.name],
          resourceName: displayName,
        }}
      />
    );
  };

  const listFormatter = {
    [listingField.name]: record => record?.[listingField.name],
  };

  if (!listQuery.isSuccess || (op === EDIT && !itemQuery.isSuccess)) {
    return null;
  }

  const initialValues = op === CREATE ? {} : itemQuery.data;

  return (
    <Paneset>
      <Pane
        defaultWidth="fill"
        lastMenu={
          <PaneMenu>
            <Button
              buttonStyle="primary paneHeaderNewButton"
              id={`clickable-new-${resourceId}`}
              marginBottom0
              onClick={() => history.push(`${match.url}/create${location.search}`)}
            >
              <FormattedMessage id="ui-rsdir.new" />
            </Button>
          </PaneMenu>
        }
        noOverflow
        padContent={false}
        paneTitle={<FormattedMessage id="ui-rsdir.resource.resultsCount" values={{ count: totalCount, resourceName }} />}
      >
        <MultiColumnList
          autosize
          columnMapping={{
            [listingField.name]: listingField.displayName,
          }}
          contentData={sparseRecords}
          formatter={listFormatter}
          id={`${resourceId}-list`}
          isEmptyMessage={intl.formatMessage({ id: 'stripes-smart-components.sas.noResults.noTerms' })}
          loading={listQuery.isFetching}
          onNeedMoreData={fetchMore}
          onRowClick={(_e, rowData) => history.push(`${match.url}/edit/${rowData.id}${location.search}`)}
          pageAmount={PER_PAGE}
          pagingType={MCLPagingTypes.PREV_NEXT}
          totalCount={totalCount}
          visibleColumns={[listingField.name]}
        />
      </Pane>
      {op && (
        <Form
          onSubmit={submit}
          initialValues={initialValues}
          keepDirtyOnReinitialize
        >
          {({ handleSubmit, pristine, submitting, submitSucceeded, invalid }) => (
            <Pane
              defaultWidth="fill"
              centerContent
              dismissible
              footer={getFooter(handleSubmit, pristine, submitting, invalid)}
              onClose={close}
              paneTitle={paneTitle(initialValues)}
            >
              <form onSubmit={handleSubmit} id={`form-${resourceId}`}>
                <Row>
                  {editableFields.map(field => (
                    <Col key={field.name} xs={12}>
                      {renderField(field)}
                    </Col>
                  ))}
                </Row>
              </form>
              <FormattedMessage id="ui-rsdir.confirmDirtyNavigate">
                {prompt => <Prompt when={!pristine && !(submitting || submitSucceeded)} message={prompt[0]} />}
              </FormattedMessage>
              <Modal
                open={deleteModalOpen}
                label={<FormattedMessage id="ui-rsdir.resource.delete.confirmTitle" values={{ resourceName: displayName }} />}
                onClose={() => setDeleteModalOpen(false)}
                footer={(
                  <>
                    <Button
                      buttonStyle="default"
                      marginBottom0
                      onClick={() => setDeleteModalOpen(false)}
                    >
                      <FormattedMessage id="ui-rsdir.cancel" />
                    </Button>
                    <Button
                      buttonStyle="danger"
                      disabled={deleter.isLoading}
                      marginBottom0
                      onClick={() => deleter.mutate()}
                    >
                      <FormattedMessage id="ui-rsdir.delete" />
                    </Button>
                  </>
                )}
              >
                <FormattedMessage
                  id="ui-rsdir.resource.delete.confirmMessage"
                  values={{
                    name: initialValues?.[listingField.name],
                    resourceName: displayName,
                  }}
                />
              </Modal>
            </Pane>
          )}
        </Form>
      )}
    </Paneset>
  );
};

export default RestResourceManager;
