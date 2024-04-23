export type PropertyFilter = {
  date: DatePropertyFilter;
  property: string;
  type?: 'date';
};

type DatePropertyFilter =
  | {
      equals: string;
    }
  | {
      before: string;
    }
  | {
      after: string;
    }
  | {
      on_or_before: string;
    }
  | {
      on_or_after: string;
    }
  | {
      this_week: EmptyObject;
    }
  | {
      past_week: EmptyObject;
    }
  | {
      past_month: EmptyObject;
    }
  | {
      past_year: EmptyObject;
    }
  | {
      next_week: EmptyObject;
    }
  | {
      next_month: EmptyObject;
    }
  | {
      next_year: EmptyObject;
    }
  | ExistencePropertyFilter;

type EmptyObject = Record<string, never>;

type ExistencePropertyFilter =
  | {
      is_empty: true;
    }
  | {
      is_not_empty: true;
    };
