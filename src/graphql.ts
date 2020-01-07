import axios from "axios";

export default class GraphQl {
  private headers: any;
  constructor(private endpoint: string, header: string) {
    const [headerKey, headerVal] = header.split("=");
    this.headers = {
      [headerKey]: headerVal
    };
  }

  async worker(id: string): Promise<CronJobModel> {
    const query = {
      query: queries.getById,
      variables: {
        id
      }
    };

    const { data: { cronjob = {} } = {} } = ({} = await this.transact(query));

    return cronjob as CronJobModel;
  }

  async workers(): Promise<CronJobModel[]> {
    const query = queries.getAll;

    const { data: { cronjob = {} } = {}, errors = null } = await this.transact({
      query
    });
    if (errors) throw errors;
    return (cronjob as any[]).map(p => p as CronJobModel) as CronJobModel[];
  }

  async save(cronjob: CronJobModel) {
    const query = {
      query: queries.upsert,
      variables: { objects: [cronjob] }
    };

    const { errors = null } = await this.transact(query);

    if (errors) throw errors;
  }

  private async transact(query: any) {
    const { data } = await axios.post(this.endpoint, query, {
      headers: this.headers
    });

    return data;
  }
}

export interface CronJobModel {
  id: string;
  name: string;
  cron: string;
  description?: string;
  code?: string;
  httpUrl?: string;
  httpMethod?: string;
  httpBody?: string;
  httpHeaders?: string;
}

export const queries = {
  upsert:
    "mutation insert($objects: [cronjob_insert_input!]!){ insert_cronjob(objects: $objects, on_conflict: {constraint: cronjob_pkey, update_columns: [name, description, code, cron, httpUrl, httpBody, httpMethod, httpHeaders]} ) { affected_rows } }",
  getAll: `query { cronjob(where: {name: {_neq: ""}, cron: {_neq: ""}}) { id name description code cron httpBody httpHeaders httpMethod httpUrl created_at updated_at } }`,
  getById: `query findCronJob($id: String!) { cronjob(where: {id: {_eq:$id } }){ id name cron description code httpBody httpHeaders httpMethod httpUrl } }`
};
