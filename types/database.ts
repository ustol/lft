export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PersonStatus = "alive" | "deceased";
export type RelationshipType =
  | "mother"
  | "father"
  | "brother"
  | "sister"
  | "son"
  | "daughter";
export type ConnectionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";
export type TreeVisibility = "private" | "connections_only" | "public";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          lftid: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          tree_visibility: TreeVisibility;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          lftid: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          tree_visibility?: TreeVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          tree_visibility?: TreeVisibility;
          updated_at?: string;
        };
        Relationships: [];
      };
      persons: {
        Row: {
          id: string;
          lftid: string;
          owner_id: string;
          first_name: string;
          middle_names: string | null;
          surname: string;
          date_of_birth: string | null;
          date_of_death: string | null;
          status: PersonStatus;
          cause_of_death: string | null;
          place_of_birth: string | null;
          birth_lat: number | null;
          birth_lng: number | null;
          place_of_death: string | null;
          death_lat: number | null;
          death_lng: number | null;
          is_self: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lftid: string;
          owner_id: string;
          first_name: string;
          middle_names?: string | null;
          surname?: string;
          date_of_birth?: string | null;
          date_of_death?: string | null;
          status?: PersonStatus;
          cause_of_death?: string | null;
          place_of_birth?: string | null;
          birth_lat?: number | null;
          birth_lng?: number | null;
          place_of_death?: string | null;
          death_lat?: number | null;
          death_lng?: number | null;
          is_self?: boolean;
        };
        Update: {
          first_name?: string;
          middle_names?: string | null;
          surname?: string;
          date_of_birth?: string | null;
          date_of_death?: string | null;
          status?: PersonStatus;
          cause_of_death?: string | null;
          place_of_birth?: string | null;
          birth_lat?: number | null;
          birth_lng?: number | null;
          place_of_death?: string | null;
          death_lat?: number | null;
          death_lng?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "persons_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      photos: {
        Row: {
          id: string;
          person_id: string;
          owner_id: string;
          storage_path: string;
          url: string;
          title: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          owner_id: string;
          storage_path: string;
          url: string;
          title?: string | null;
          description?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string | null;
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "photos_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          }
        ];
      };
      relationships: {
        Row: {
          id: string;
          person_a_id: string;
          person_b_id: string;
          relationship: RelationshipType;
          owner_id: string;
          is_cross_tree: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          person_a_id: string;
          person_b_id: string;
          relationship: RelationshipType;
          owner_id: string;
          is_cross_tree?: boolean;
        };
        Update: {
          relationship?: RelationshipType;
        };
        Relationships: [
          {
            foreignKeyName: "relationships_person_a_id_fkey";
            columns: ["person_a_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_person_b_id_fkey";
            columns: ["person_b_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          }
        ];
      };
      tree_connections: {
        Row: {
          id: string;
          requester_id: string;
          target_id: string;
          requester_person_id: string | null;
          target_person_id: string | null;
          relationship: RelationshipType;
          status: ConnectionStatus;
          message: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          target_id: string;
          requester_person_id?: string | null;
          target_person_id?: string | null;
          relationship: RelationshipType;
          status?: ConnectionStatus;
          message?: string | null;
        };
        Update: {
          status?: ConnectionStatus;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tree_connections_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tree_connections_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_lftid: {
        Args: { prefix?: string };
        Returns: string;
      };
    };
    Enums: {
      person_status: PersonStatus;
      relationship_type: RelationshipType;
      connection_status: ConnectionStatus;
      tree_visibility: TreeVisibility;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience aliases
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type PersonRow = Database["public"]["Tables"]["persons"]["Row"];
export type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];
export type RelationshipRow =
  Database["public"]["Tables"]["relationships"]["Row"];
export type TreeConnectionRow =
  Database["public"]["Tables"]["tree_connections"]["Row"];
