export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          owner_id: string;
          domain: string;
          name: string | null;
          summary: string | null;
          icp_id: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          domain: string;
          name?: string | null;
          summary?: string | null;
          icp_id?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          domain?: string;
          name?: string | null;
          summary?: string | null;
          icp_id?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'companies_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      icps: {
        Row: {
          id: string;
          company_id: string;
          title: string | null;
          description: string | null;
          personas: Json | null;
          company_size_range: string | null;
          revenue_range: string | null;
          industries: Json | null;
          regions: Json | null;
          funding_stages: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title?: string | null;
          description?: string | null;
          personas?: Json | null;
          company_size_range?: string | null;
          revenue_range?: string | null;
          industries?: Json | null;
          regions?: Json | null;
          funding_stages?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string | null;
          description?: string | null;
          personas?: Json | null;
          company_size_range?: string | null;
          revenue_range?: string | null;
          industries?: Json | null;
          regions?: Json | null;
          funding_stages?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'icps_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      prospects: {
        Row: {
          id: string;
          company_id: string;
          domain: string;
          enriched_data: Json | null;
          qualification_score: string | null;
          explanation: string | null;
          status: 'pending' | 'qualified' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          domain: string;
          enriched_data?: Json | null;
          qualification_score?: string | null;
          explanation?: string | null;
          status?: 'pending' | 'qualified' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          domain?: string;
          enriched_data?: Json | null;
          qualification_score?: string | null;
          explanation?: string | null;
          status?: 'pending' | 'qualified' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prospects_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin' | 'user';
      company_status: 'active' | 'inactive';
      qualification_status: 'pending' | 'qualified' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
